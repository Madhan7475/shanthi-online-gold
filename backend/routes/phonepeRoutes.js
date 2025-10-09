const express = require('express');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');
const Order = require('../models/Order');

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

  console.log(`[${requestId}] PhonePe ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? { ...req.body, amount: req.body?.amount } : undefined
  });

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
      const userId = req.user?.uid || req.user?.id;

      // Log checkout initiation attempt
      console.log(`Processing checkout initiation for user: ${userId}`);

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

      const result = await phonePeService.initiatePayment({
        amount,
        merchantOrderId,
        redirectUrl
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

      // Log order creation attempt
      console.log(`Processing order creation for user: ${userId}`);

      // Create order using PhonePe service
      const result = await phonePeService.createSdkOrder({
        amount,
        merchantOrderId,
        redirectUrl
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

      // Log order status check attempt
      console.log(`Processing order status check for orderId: ${orderId}`);

      // Check order status using PhonePe service with enhanced mapping
      const result = await phonePeService.getEnhancedOrderStatus(orderId.trim());

      // If payment is completed, update the database order status to "Processing"
      if (result.state === 'COMPLETED') {
        try {
          const order = await Order.findOne({ _id: orderId.trim() });

          if (order && order.status !== 'Processing') {
            const prev = order.status;
            order.status = 'Processing';
            if (prev !== order.status) {
              order.statusUpdatedAt = new Date();
            }
            await order.save();

            console.log(`Updated order ${order._id} status to Processing (payment completed)`);
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
