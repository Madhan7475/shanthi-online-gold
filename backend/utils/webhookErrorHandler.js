/**
 * PhonePe Webhook Error Handler
 * 
 * Centralized error handling for webhook operations with proper logging
 * and error classification for monitoring and debugging.
 */

const { PhonePeException } = require('pg-sdk-node');

class WebhookError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'WebhookError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class WebhookErrorHandler {
  /**
   * Handle PhonePe SDK errors
   * @param {Error} error - Original error
   * @param {string} context - Context where error occurred
   * @returns {WebhookError} Standardized webhook error
   */
  static handlePhonePeError(error, context) {
    if (error instanceof PhonePeException) {
      return new WebhookError(
        `PhonePe SDK error in ${context}: ${error.message}`,
        'PHONEPE_SDK_ERROR',
        error.httpStatusCode || 500,
        {
          originalCode: error.code,
          httpStatusCode: error.httpStatusCode,
          data: error.data,
          context
        }
      );
    }

    return new WebhookError(
      `Unknown PhonePe error in ${context}: ${error.message}`,
      'PHONEPE_UNKNOWN_ERROR',
      500,
      { context, originalError: error.message }
    );
  }

  /**
   * Handle validation errors
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {WebhookError} Validation error
   */
  static handleValidationError(message, details = null) {
    return new WebhookError(
      `Validation error: ${message}`,
      'VALIDATION_ERROR',
      400,
      details
    );
  }

  /**
   * Handle database errors
   * @param {Error} error - Database error
   * @param {string} operation - Database operation
   * @returns {WebhookError} Database error
   */
  static handleDatabaseError(error, operation) {
    return new WebhookError(
      `Database error during ${operation}: ${error.message}`,
      'DATABASE_ERROR',
      500,
      {
        operation,
        originalError: error.message,
        stack: error.stack
      }
    );
  }

  /**
   * Handle timeout errors
   * @param {string} operation - Operation that timed out
   * @returns {WebhookError} Timeout error
   */
  static handleTimeoutError(operation) {
    return new WebhookError(
      `Operation timeout: ${operation}`,
      'TIMEOUT_ERROR',
      408,
      { operation }
    );
  }

  /**
   * Handle duplicate webhook errors
   * @param {string} orderId - Order ID of duplicate
   * @returns {WebhookError} Duplicate error
   */
  static handleDuplicateError(orderId) {
    return new WebhookError(
      `Duplicate webhook for order: ${orderId}`,
      'DUPLICATE_WEBHOOK',
      409,
      { orderId }
    );
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {string} operation - Network operation
   * @returns {WebhookError} Network error
   */
  static handleNetworkError(error, operation) {
    return new WebhookError(
      `Network error during ${operation}: ${error.message}`,
      'NETWORK_ERROR',
      503,
      {
        operation,
        originalError: error.message,
        code: error.code
      }
    );
  }

  /**
   * Log error with appropriate level
   * @param {WebhookError} error - Error to log
   * @param {string} requestId - Request ID for tracking
   */
  static logError(error, requestId = 'unknown') {
    const logData = {
      requestId,
      errorCode: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack
    };

    // Log based on error severity
    switch (error.code) {
      case 'VALIDATION_ERROR':
      case 'DUPLICATE_WEBHOOK':
        console.warn(`[${requestId}] Webhook Warning:`, logData);
        break;
        
      case 'PHONEPE_SDK_ERROR':
      case 'DATABASE_ERROR':
      case 'NETWORK_ERROR':
        console.error(`[${requestId}] Webhook Error:`, logData);
        break;
        
      case 'TIMEOUT_ERROR':
        console.error(`[${requestId}] Webhook Timeout:`, logData);
        break;
        
      default:
        console.error(`[${requestId}] Webhook Unknown Error:`, logData);
    }
  }

  /**
   * Create error response for API
   * @param {WebhookError} error - Error to convert
   * @param {string} requestId - Request ID
   * @returns {Object} API error response
   */
  static createErrorResponse(error, requestId = null) {
    // Don't expose sensitive details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(requestId && { requestId }),
        ...(error.details && !isProduction && { details: error.details }),
        timestamp: error.timestamp
      }
    };
  }

  /**
   * Handle errors in webhook processing pipeline
   * @param {Error} error - Original error
   * @param {string} context - Context of the error
   * @param {string} requestId - Request ID
   * @returns {Object} Processed error response
   */
  static processWebhookError(error, context, requestId) {
    let webhookError;

    // Convert to WebhookError if not already
    if (error instanceof WebhookError) {
      webhookError = error;
    } else if (error instanceof PhonePeException) {
      webhookError = this.handlePhonePeError(error, context);
    } else if (error.name === 'ValidationError') {
      webhookError = this.handleValidationError(error.message);
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      webhookError = this.handleDatabaseError(error, context);
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      webhookError = this.handleNetworkError(error, context);
    } else {
      webhookError = new WebhookError(
        `Unexpected error in ${context}: ${error.message}`,
        'UNEXPECTED_ERROR',
        500,
        { context, originalError: error.message }
      );
    }

    // Log the error
    this.logError(webhookError, requestId);

    // Return API response
    return this.createErrorResponse(webhookError, requestId);
  }

  /**
   * Get error metrics for monitoring
   * @param {WebhookError} error - Error to analyze
   * @returns {Object} Error metrics
   */
  static getErrorMetrics(error) {
    return {
      errorCode: error.code,
      statusCode: error.statusCode,
      severity: this.getErrorSeverity(error.code),
      category: this.getErrorCategory(error.code),
      timestamp: error.timestamp
    };
  }

  /**
   * Get error severity level
   * @param {string} errorCode - Error code
   * @returns {string} Severity level
   */
  static getErrorSeverity(errorCode) {
    const severityMap = {
      'VALIDATION_ERROR': 'low',
      'DUPLICATE_WEBHOOK': 'low',
      'TIMEOUT_ERROR': 'medium',
      'NETWORK_ERROR': 'medium',
      'DATABASE_ERROR': 'high',
      'PHONEPE_SDK_ERROR': 'high',
      'UNEXPECTED_ERROR': 'critical'
    };

    return severityMap[errorCode] || 'medium';
  }

  /**
   * Get error category
   * @param {string} errorCode - Error code
   * @returns {string} Error category
   */
  static getErrorCategory(errorCode) {
    const categoryMap = {
      'VALIDATION_ERROR': 'client',
      'DUPLICATE_WEBHOOK': 'client',
      'TIMEOUT_ERROR': 'system',
      'NETWORK_ERROR': 'system',
      'DATABASE_ERROR': 'system',
      'PHONEPE_SDK_ERROR': 'external',
      'UNEXPECTED_ERROR': 'system'
    };

    return categoryMap[errorCode] || 'system';
  }
}

module.exports = {
  WebhookError,
  WebhookErrorHandler
};