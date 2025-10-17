const express = require('express');
const { randomUUID } = require('crypto');
const webhookService = require('../services/phonePeWebhookService');

const router = express.Router();

/**
 * PhonePe Webhook Routes
 * 
 * Handles Server-to-Server callbacks from PhonePe
 * Requires raw body parsing middleware to be applied before these routes
 */

/**
 * Simple rate limiting for webhook endpoint
 * More generous limits since these are server-to-server calls
 */
const webhookRateLimit = (() => {
  const requests = new Map();
  const WINDOW_MS = 1 * 60 * 1000; // 1 minute window
  const MAX_REQUESTS = 100; // Max 100 requests per minute per IP

  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }
    
    const clientRequests = requests.get(clientId);
    // Remove old requests
    const validRequests = clientRequests.filter(time => now - time < WINDOW_MS);
    
    if (validRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many webhook requests',
          code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
        }
      });
    }
    
    validRequests.push(now);
    requests.set(clientId, validRequests);
    
    next();
  };
})();

/**
 * Webhook logging middleware
 * Logs essential webhook request information for monitoring
 */
const webhookLogger = (req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;

  console.log(`[${requestId}] PhonePe webhook received: ${req.method} ${req.url}`);
  
  const startTime = Date.now();
  req.startTime = startTime;

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Response: ${res.statusCode} (${duration}ms)`);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Webhook request validation middleware
 */
const validateWebhookRequest = (req, res, next) => {
  const requestId = req.requestId;
  
  if (!req.rawBody) {
    console.warn(`[${requestId}] Missing raw body`);
    return res.status(400).json({
      success: false,
      error: {
        message: 'Raw request body is required',
        code: 'MISSING_RAW_BODY'
      }
    });
  }

  const authorization = req.get('Authorization');
  if (!authorization) {
    console.warn(`[${requestId}] Missing authorization header`);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authorization header is required',
        code: 'MISSING_AUTHORIZATION'
      }
    });
  }

  next();
};

/**
 * Webhook processing timeout handler
 */
const webhookTimeout = (req, res, next) => {
  // Set a timeout for webhook processing (PhonePe expects response within 2-3 seconds)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[${req.requestId}] Webhook processing timeout`);
      res.status(408).json({
        success: false,
        error: {
          message: 'Webhook processing timeout',
          code: 'PROCESSING_TIMEOUT'
        }
      });
    }
  }, 2500); // 2.5 seconds timeout

  // Clear timeout when response is sent
  res.on('finish', () => {
    clearTimeout(timeout);
  });

  next();
};

/**
 * POST /api/phonepe/webhook
 * Main webhook endpoint for PhonePe S2S callbacks
 * 
 * Handles all callback types:
 * - CHECKOUT_ORDER_COMPLETED
 * - CHECKOUT_ORDER_FAILED  
 * - PG_REFUND_COMPLETED
 * - PG_REFUND_FAILED
 * - PG_REFUND_ACCEPTED
 */
router.post('/webhook',
  webhookRateLimit,
  webhookLogger,
  webhookTimeout,
  validateWebhookRequest,
  async (req, res) => {
    const requestId = req.webhookRequestId;
    
    try {
      // Extract required data
      const authorization = req.get('Authorization');
      const responseBody = req.rawBody;
      
      // Validate webhook authenticity using PhonePe SDK
      const validationResult = await webhookService.validateWebhookCallback(
        authorization,
        responseBody
      );

      if (!validationResult.isValid) {
        console.error(`[${requestId}] Webhook validation failed: ${validationResult.error}`);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Webhook validation failed',
            code: 'INVALID_WEBHOOK_SIGNATURE',
            details: validationResult.error
          }
        });
      }

      // Check for duplicate webhooks
      const callbackData = webhookService.extractCallbackData(validationResult.callbackResponse.payload);
      const isDuplicate = await webhookService.isDuplicateWebhook(callbackData);
      
      if (isDuplicate) {
        console.warn(`[${requestId}] Duplicate webhook ignored: ${callbackData.orderId}`);
        return res.status(200).json({
          success: true,
          message: 'Duplicate webhook ignored',
          orderId: callbackData.orderId
        });
      }

      // Process the callback
      const processingResult = await webhookService.processCallback(validationResult.callbackResponse);

      if (!processingResult.success) {
        console.error(`[${requestId}] Callback processing failed:`, processingResult.message);
        // Still return 200 to acknowledge receipt
        return res.status(200).json({
          success: true,
          message: 'Webhook received but processing failed',
          details: processingResult
        });
      }

      console.log(`[${requestId}] Callback processed: ${processingResult.message}`);

      // Acknowledge successful processing
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        result: processingResult
      });

    } catch (error) {
      console.error(`[${requestId}] Webhook processing error: ${error.message}`);

      // Always return 200 to PhonePe to avoid retries for non-recoverable errors
      res.status(200).json({
        success: false,
        error: {
          message: 'Internal webhook processing error',
          code: 'WEBHOOK_PROCESSING_ERROR',
          requestId
        }
      });
    }
  }
);

/**
 * GET /api/phonepe/webhook/health
 * Health check endpoint for webhook service
 */
router.get('/webhook/health', (req, res) => {
  try {
    // Check webhook service health
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.PHONEPE_ENV || 'sandbox',
      version: '1.0.0'
    };

    // Check if callback credentials are configured
    const hasCredentials = !!(process.env.PHONEPE_CALLBACK_USERNAME && process.env.PHONEPE_CALLBACK_PASSWORD);
    healthStatus.callbackCredentials = hasCredentials ? 'configured' : 'missing';

    if (!hasCredentials) {
      healthStatus.status = 'degraded';
      healthStatus.warnings = ['Callback credentials not configured'];
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Webhook health check error:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Global error handler for webhook routes
 */
router.use((error, req, res, next) => {
  const requestId = req.webhookRequestId || 'unknown';
  console.error(`[${requestId}] Webhook route error:`, error.message);
  console.error(`[${requestId}] Error stack:`, error.stack);
  
  // Always return 200 to PhonePe for webhook endpoints to avoid retries
  if (req.path.includes('/webhook')) {
    res.status(200).json({
      success: false,
      error: {
        message: 'Webhook processing error',
        code: 'WEBHOOK_ERROR',
        requestId
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;