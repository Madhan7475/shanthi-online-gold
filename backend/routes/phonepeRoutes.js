const express = require('express');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');
const Order = require('../models/Order');
const { getPhonePeConfig } = require('../config/phonepe');
const NotificationManager = require('../services/NotificationManager');

const router = express.Router();

/**
 * PhonePe Payment Routes
 * 
 * Available endpoints:
 * - POST /api/phonepe/initiate-checkout - Initiate PhonePe checkout flow
 * - POST /api/phonepe/create-order - Create a new PhonePe SDK order
 * - GET /api/phonepe/order-status/:orderId - Check single order status
 */

/**
 * Input validation middleware for create order
 */
const validateCreateOrderInput = (req, res, next) => {
  const { amount } = req.body;

  // Basic validation
  if (!amount) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Amount is required',
        code: 'MISSING_AMOUNT'
      }
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT'
      }
    });
  }

  if (amount < 1) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Minimum order amount is ₹1',
        code: 'AMOUNT_TOO_LOW'
      }
    });
  }

  next();
};

// Simple rate limiting implementation
const rateLimiter = (() => {
  const requests = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 10; // Max 10 orders per 15 minutes per user

  return (req, res, next) => {
    const userId = req.user?.uid || req.user?.id || req.ip;
    const now = Date.now();

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    // Remove old requests
    const validRequests = userRequests.filter(time => now - time < WINDOW_MS);

    if (validRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many order creation requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
})();

// Request logger
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `phonePe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.phonepeRequestId = requestId;

  console.log(`[${requestId}] PhonePe ${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Response: ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Import PhonePe service
const phonePeService = require('../services/phonePeService');

/**
 * POST /api/phonepe/initiate-checkout
 * Initiate PhonePe checkout flow
 * 
 * @body {number} amount - Amount in rupees (required)
 * @body {string} redirectUrl - URL where user will be redirected after payment (required)  
 * @body {string} [merchantOrderId] - Optional merchant order ID
 */
router.post('/initiate-checkout',
  requestLogger,
  verifyAuthFlexible,
  rateLimiter,
  validateCreateOrderInput, // Reuse same validation as create-order
  async (req, res) => {
    try {
      const { amount, redirectUrl, merchantOrderId } = req.body;

      // Validate redirectUrl if provided
      if (redirectUrl) {
        try {
          new URL(redirectUrl);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid redirectUrl format',
              code: 'INVALID_REDIRECT_URL'
            }
          });
        }
      }

      // Resolve redirect URL: in PRODUCTION always use configured URL (ignore client-provided)
      const cfg = getPhonePeConfig();
      const effectiveRedirectUrl =
        process.env.PHONEPE_ENV === 'production'
          ? cfg.redirectUrl
          : (redirectUrl || cfg.redirectUrl);

      console.log(`[PhonePe] Effective redirectUrl for initiate-checkout: ${effectiveRedirectUrl}`);

      const result = await phonePeService.initiatePayment({
        amount,
        merchantOrderId,
        redirectUrl: effectiveRedirectUrl,
      });

      // If merchantOrderId is provided, find and update the existing order
      if (merchantOrderId) {
        try {
          const order = await Order.findOne({ _id: merchantOrderId });

          if (order) {
            // Update the transactionId with PhonePe orderId
            order.transactionId = result.orderId;
            await order.save();

            console.log(`Updated order ${order._id} with transactionId: ${result.orderId}`);
          } else {
            console.log(`No order found with merchantOrderId: ${merchantOrderId}`);
          }
        } catch (dbError) {
          console.error('Database update failed:', dbError);
          // Continue with PhonePe response even if database update fails
        }
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('Checkout initiation controller error:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during checkout initiation',
          code: 'INTERNAL_ERROR',
          errMessage: error?.message
        }
      });
    }
  }
);

/**
 * POST /api/phonepe/create-order
 * Create a PhonePe SDK order
 * 
 * @body {number} amount - Amount in rupees (required)
 * @body {string} [merchantOrderId] - Optional merchant order ID
 * @body {string} [redirectUrl] - Optional redirect URL
 */
router.post('/create-order',
  requestLogger,
  verifyAuthFlexible,
  rateLimiter,
  validateCreateOrderInput,
  async (req, res) => {
    try {
      const { amount, merchantOrderId, redirectUrl } = req.body;
      const userId = req.user?.uid || req.user?.id;

      // Create order using PhonePe service
      // Resolve redirect URL: in PRODUCTION always use configured URL (ignore client-provided)
      const cfg = getPhonePeConfig();
      const effectiveRedirectUrl =
        process.env.PHONEPE_ENV === 'production'
          ? cfg.redirectUrl
          : (redirectUrl || cfg.redirectUrl);

      console.log(`[PhonePe] Effective redirectUrl for create-order: ${effectiveRedirectUrl}`);

      const result = await phonePeService.createSdkOrder({
        amount,
        merchantOrderId,
        redirectUrl: effectiveRedirectUrl,
      });

      // If merchantOrderId is provided, find and update the existing order
      if (merchantOrderId) {
        try {
          const order = await Order.findOne({ _id: merchantOrderId });

          if (order) {
            // Update the transactionId with PhonePe orderId
            order.transactionId = result.orderId;
            await order.save();

            console.log(`Updated order ${order._id} with transactionId: ${result.orderId}`);
          } else {
            console.log(`No order found with merchantOrderId: ${merchantOrderId}`);
          }
        } catch (dbError) {
          console.error('Database update failed:', dbError);
          // Continue with PhonePe response even if database update fails
        }
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('Order creation controller error:', error);

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during order creation',
          code: 'INTERNAL_ERROR',
          errMessage: error?.message
        }
      });
    }
  }
);

/**
 * GET /api/payments/order-status/:orderId
 * Check PhonePe order status
 * 
 * @param {string} orderId - PhonePe order ID (required)
 */
router.get('/order-status/:orderId',
  requestLogger,
  verifyAuthFlexible,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // Validate order ID
      if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Order ID is required and must be a valid string',
            code: 'INVALID_ORDER_ID'
          }
        });
      }

      // Check order status using PhonePe service with enhanced mapping
      const result = await phonePeService.getEnhancedOrderStatus(orderId.trim());

      // If payment is completed, update the database order status to "Processing"
      if (result.state === 'COMPLETED') {
        try {
          const order = await Order.findOne({ _id: orderId.trim() });

          if (order && order.status?.toLowerCase() === 'pending') {
            const prevStatus = order.status;
            order.status = 'Processing';
            if (prevStatus !== order.status) {
              order.statusUpdatedAt = new Date();
            }
            await order.save();

            console.log(`Updated order ${order._id} status to Processing (payment completed)`);

            // Trigger order confirmation notification - Enterprise system (non-blocking)
            try {
              console.log(`Payment completed for order ${order._id} - sending confirmation notification`);
              NotificationManager.sendNotification('order', order._id, 'processing', 'payment_completion');
            } catch (notificationError) {
              console.error('Error sending order confirmation notification:', notificationError);
              // Don't fail the status update if notification fails
            }
          } else if (!order) {
            console.log(`No order found with transactionId: ${orderId}`);
          } else {
            console.log(`Order ${order._id} already has Processing status`);
          }
        } catch (dbError) {
          console.error('Database order status update failed:', dbError);
          // Continue with PhonePe response even if database update fails
        }
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('Order status check controller error:', error);

      // Handle specific PhonePe errors
      if (error.message.includes('Order not found') || error.message.includes('Invalid order')) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Order not found',
            code: 'ORDER_NOT_FOUND',
            orderId: req.params.orderId
          }
        });
      }

      if (error.message.includes('timeout')) {
        return res.status(408).json({
          success: false,
          error: {
            message: 'Order status check timeout',
            code: 'REQUEST_TIMEOUT',
            orderId: req.params.orderId
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error during order status check',
          code: 'INTERNAL_ERROR',
          orderId: req.params.orderId,
          errMessage: error?.message
        }
      });
    }
  }
);

/**
 * Debug: expose non-sensitive PhonePe config
 * NOTE: No secrets are returned.
 */
router.get('/config', requestLogger, async (req, res) => {
  try {
    const { getPhonePeConfig } = require('../config/phonepe');
    const cfg = getPhonePeConfig();
    res.json({
      environment: cfg.environment,
      clientVersion: cfg.clientVersion,
      redirectUrl: cfg.redirectUrl,
      clientIdPrefix: cfg.clientId ? String(cfg.clientId).slice(0, 6) + '***' : null,
      // Debug-only, non-sensitive checks to validate Render env vs Dashboard:
      clientSecretLength: (process.env.PHONEPE_CLIENT_SECRET || '').length,
      clientSecretSuffix: process.env.PHONEPE_CLIENT_SECRET ? ('***' + String(process.env.PHONEPE_CLIENT_SECRET).slice(-4)) : null,
      // Non-sensitive merchant configuration
      merchantId: process.env.PHONEPE_MERCHANT_ID || null,
      keyIndex: process.env.PHONEPE_KEY_INDEX || null,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load config', message: e?.message || e });
  }
});

/**
 * Debug: fetch backend's outbound IP (for IP whitelisting checks)
 * Calls a public IP service from the server to reveal egress IP.
 */
router.get('/outbound-ip', requestLogger, async (req, res) => {
  const https = require('https');

  const get = (url) =>
    new Promise((resolve, reject) => {
      https
        .get(url, { headers: { 'User-Agent': 'node' } }, (r) => {
          let data = '';
          r.on('data', (c) => (data += c));
          r.on('end', () => resolve({ status: r.statusCode, data: data.trim() }));
        })
        .on('error', reject);
    });

  try {
    const a = await get('https://api.ipify.org?format=json');
    let ip = null;
    try {
      ip = JSON.parse(a.data).ip || null;
    } catch {
      ip = null;
    }
    // Fallback secondary service (plain text)
    const b = await get('https://ifconfig.me/ip').catch(() => ({ status: null, data: null }));
    const ip2 = b && b.data ? b.data : null;

    res.json({
      ip,
      ip2,
      sources: {
        api_ipify_org: a,
        ifconfig_me: b,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch outbound IP', message: e?.message || String(e) });
  }
});

/**
 * Webhook endpoints (for going LIVE)
 * Note:
 * - Do NOT put your redirect URL here. This is for server-to-server callbacks.
 * - Protect with a simple token header to prevent abuse.
 * - Set env PHONEPE_WEBHOOK_TOKEN in Render and configure the same in PhonePe Dashboard.
 */
router.get('/webhook/ping', requestLogger, async (req, res) => {
  return res.json({ ok: true, time: new Date().toISOString() });
});

router.post('/webhook', requestLogger, async (req, res) => {
  try {
    // Accept either a shared header token or HTTP Basic Auth (username/password)
    const expectedToken = process.env.PHONEPE_WEBHOOK_TOKEN || null;
    const basicUser = process.env.PHONEPE_WEBHOOK_BASIC_USER || null;
    const basicPass = process.env.PHONEPE_WEBHOOK_BASIC_PASS || null;

    // Extract header/query token
    const headerToken = req.get('X-Webhook-Token') || req.query.token || null;

    // Parse Basic Authorization header
    const authHeader = req.get('authorization') || req.get('Authorization');
    let basicOk = false;
    if (authHeader && authHeader.startsWith('Basic ') && basicUser && basicPass) {
      try {
        const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
        const [u, p] = decoded.split(':');
        if (u === basicUser && p === basicPass) basicOk = true;
      } catch { }
    }

    // Enforce auth only if any method is configured
    if ((expectedToken && headerToken !== expectedToken) && !(basicUser && basicPass && basicOk)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized webhook' });
    }

    const payload = req.body || {};
    // Common fields (PhonePe payloads can vary by product/version)
    const phonepeOrderId =
      payload.orderId ||
      payload.data?.orderId ||
      payload.transactionId ||
      payload.data?.transactionId ||
      null;

    const merchantOrderId =
      payload.merchantOrderId ||
      payload.data?.merchantOrderId ||
      payload.orderIdMerchant ||
      null;

    const state =
      payload.state ||
      payload.data?.state ||
      payload.status ||
      payload.data?.status ||
      null;

    console.log('[PhonePe Webhook] Received:', {
      hasBody: !!req.body,
      phonepeOrderId,
      merchantOrderId,
      state,
      keys: Object.keys(payload || {}),
    });

    // Try update by merchantOrderId first (your local Order _id)
    let matchedBy = 'none';
    if (merchantOrderId) {
      try {
        const order = await Order.findById(merchantOrderId);
        if (order) {
          if (phonepeOrderId && !order.transactionId) {
            order.transactionId = phonepeOrderId;
          }
          if (state === 'COMPLETED') {
            const prev = order.status;
            order.status = 'Processing';
            if (prev !== order.status) order.statusUpdatedAt = new Date();
          } else if (state === 'FAILED' || state === 'CANCELLED') {
            order.status = 'Cancelled';
            order.statusUpdatedAt = new Date();
          }
          await order.save();
          matchedBy = 'merchantOrderId';
        }
      } catch (e) {
        console.warn('[PhonePe Webhook] Update by merchantOrderId failed:', e?.message || e);
      }
    }

    // Fallback: try update by PhonePe order/transaction id
    if (matchedBy === 'none' && phonepeOrderId) {
      try {
        const order = await Order.findOne({ transactionId: phonepeOrderId });
        if (order) {
          if (state === 'COMPLETED') {
            const prev = order.status;
            order.status = 'Processing';
            if (prev !== order.status) order.statusUpdatedAt = new Date();
          } else if (state === 'FAILED' || state === 'CANCELLED') {
            order.status = 'Cancelled';
            order.statusUpdatedAt = new Date();
          }
          await order.save();
          matchedBy = 'transactionId';
        }
      } catch (e) {
        console.warn('[PhonePe Webhook] Update by transactionId failed:', e?.message || e);
      }
    }

    return res.status(200).json({
      ok: true,
      matchedBy,
      state,
      merchantOrderId,
      phonepeOrderId,
    });
  } catch (e) {
    console.error('[PhonePe Webhook] Handler error:', e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/**
 * Error handling middleware specific to payment routes
 */
router.use((error, req, res, next) => {
  console.error('Payment route error:', error);

  res.status(500).json({
    success: false,
    error: {
      message: 'Payment service error',
      code: 'PAYMENT_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
});

module.exports = router;
