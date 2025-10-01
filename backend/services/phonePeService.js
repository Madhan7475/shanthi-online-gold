const { CreateSdkOrderRequest, StandardCheckoutPayRequest } = require('pg-sdk-node');
const { randomUUID } = require('crypto');
const { getPhonePeClient, getPhonePeConfig, forcePhonePeClientVersion } = require('../config/phonepe.js');

/**
 * PhonePe Payment Service
 * Handles all PhonePe SDK operations
 */
class PhonePeService {
  constructor() {
    this.client = null;
    this.config = getPhonePeConfig();
  }

  /**
   * Initialize the PhonePe client
   * @private
   */
  _initializeClient() {
    if (!this.client) {
      this.client = getPhonePeClient();
    }
    return this.client;
  }

  /**
   * Validate order creation request
   * @param {Object} orderData - Order data to validate
   * @returns {Object} Validation result
   */
  validateOrderRequest(orderData) {
    const errors = [];

    // Validate amount
    if (!orderData.amount || typeof orderData.amount !== 'number') {
      errors.push('Amount is required and must be a number');
    } else if (orderData.amount < 1) {
      errors.push('Amount must be at least ₹1');
    }

    // Validate merchantOrderId if provided
    if (orderData.merchantOrderId) {
      if (typeof orderData.merchantOrderId !== 'string') {
        errors.push('Merchant Order ID must be a string');
      } else if (orderData.merchantOrderId.length > 63) {
        errors.push('Merchant Order ID must not exceed 63 characters');
      }
    }

    // Validate redirectUrl if provided
    if (orderData.redirectUrl) {
      try {
        new URL(orderData.redirectUrl);
      } catch (error) {
        errors.push('Invalid redirect URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate order ID format
   * @param {string} orderId - Order ID to validate
   * @returns {Object} Validation result
   */
  validateOrderId(orderId) {
    const errors = [];

    if (!orderId) {
      errors.push('Order ID is required');
    } else if (typeof orderId !== 'string') {
      errors.push('Order ID must be a string');
    } else if (orderId.trim().length === 0) {
      errors.push('Order ID cannot be empty');
    } else if (orderId.length > 100) {
      errors.push('Order ID is too long (max 100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate unique merchant order ID
   * @returns {string} Unique merchant order ID
   */
  generateMerchantOrderId() {
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    return `ORDER_${timestamp}_${uuid}`;
  }

  /**
   * Create SDK Order using PhonePe SDK
   * @param {Object} orderData - Order creation data
   * @param {number} orderData.amount - Amount in rupees
   * @param {string} [orderData.merchantOrderId] - Optional merchant order ID
   * @param {string} [orderData.redirectUrl] - Optional redirect URL
   * @returns {Promise<Object>} Order creation response
   */
  async initiatePayment(orderData) {
    try {
      // Validate input
      const validation = this.validateOrderRequest(orderData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize client
      this._initializeClient();

      // Prepare order data
      const merchantOrderId = orderData.merchantOrderId || this.generateMerchantOrderId();
      const amountInPaisa = Math.round(orderData.amount * 100); // Convert to paisa
      const redirectUrl = orderData.redirectUrl || this.config.redirectUrl;

      console.log(`[PhonePe] Using env=${this.config.environment} clientVersion=${this.config.clientVersion} redirectUrl=${redirectUrl}`);
      console.log(`Creating Pay order: ${merchantOrderId} for ₹${orderData.amount}`);

      // Create SDK order request
      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaisa)
        .redirectUrl(redirectUrl)
        .build();

      // Make API call with timeout + fallback once to v1 if v2 400 in PRODUCTION
      let response;
      try {
        response = await this.client.pay(request);
      } catch (err) {
        const isProd = this.config.environment === 'PRODUCTION';
        const currentVersion = this.config.clientVersion;
        const httpStatus = err?.httpStatusCode || err?.status || err?.response?.status;
        if (isProd && currentVersion === 'v2' && httpStatus === 400) {
          console.warn('[PhonePe] pay() failed with 400 on v2; retrying once with v1 credentials');
          // Force-reinit client with v1 to match v1 keys
          forcePhonePeClientVersion('v1');
          this.client = getPhonePeClient();
          this.config = { ...this.config, clientVersion: 'v1' };
          response = await this.client.pay(request);
        } else {
          throw err;
        }
      }

      console.log(`PhonePe Pay order created: ${response.orderId} for ₹${orderData.amount}`);
      return {
        ...response,
        merchantOrderId,
        amountInRupees: orderData.amount,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      const details = {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        httpStatus: error?.httpStatusCode || error?.status || error?.response?.status,
        data: error?.data || error?.response?.data,
        stack: error?.stack,
        environment: this.config?.environment,
        clientVersion: this.config?.clientVersion,
      };
      try {
        console.error('PhonePe Pay order creation failed:', JSON.stringify(details, null, 2));
      } catch {
        console.error('PhonePe Pay order creation failed:', details);
      }
      throw new Error(`PhonePe Pay order creation failed: ${error?.message || 'unknown error'}`);
    }
  }

  /**
   * Create SDK Order using PhonePe SDK
   * @param {Object} orderData - Order creation data
   * @param {number} orderData.amount - Amount in rupees
   * @param {string} [orderData.merchantOrderId] - Optional merchant order ID
   * @param {string} [orderData.redirectUrl] - Optional redirect URL
   * @returns {Promise<Object>} Order creation response
   */
  async createSdkOrder(orderData) {
    try {
      // Validate input
      const validation = this.validateOrderRequest(orderData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize client
      this._initializeClient();

      // Prepare order data
      const merchantOrderId = orderData.merchantOrderId || this.generateMerchantOrderId();
      const amountInPaisa = Math.round(orderData.amount * 100); // Convert to paisa
      const redirectUrl = orderData.redirectUrl || this.config.redirectUrl;

      console.log(`[PhonePe] Using env=${this.config.environment} clientVersion=${this.config.clientVersion} redirectUrl=${redirectUrl}`);
      console.log(`Creating PhonePe SDK order: ${merchantOrderId} for ₹${orderData.amount}`);

      // Create SDK order request
      const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaisa)
        .redirectUrl(redirectUrl)
        .build();

      // Make API call with timeout + fallback once to v1 if v2 400 in PRODUCTION
      let response;
      try {
        response = await this.client.createSdkOrder(request);
      } catch (err) {
        const isProd = this.config.environment === 'PRODUCTION';
        const currentVersion = this.config.clientVersion;
        const httpStatus = err?.httpStatusCode || err?.status || err?.response?.status;
        if (isProd && currentVersion === 'v2' && httpStatus === 400) {
          console.warn('[PhonePe] createSdkOrder() failed with 400 on v2; retrying once with v1 credentials');
          // Force-reinit client with v1 to match v1 keys
          forcePhonePeClientVersion('v1');
          this.client = getPhonePeClient();
          this.config = { ...this.config, clientVersion: 'v1' };
          response = await this.client.createSdkOrder(request);
        } else {
          throw err;
        }
      }

      console.log(`PhonePe SDK order created: ${response.orderId} for ₹${orderData.amount}`);
      return {
        ...response,
        merchantOrderId,
        amountInRupees: orderData.amount,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      const details = {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        httpStatus: error?.httpStatusCode || error?.status || error?.response?.status,
        data: error?.data || error?.response?.data,
        stack: error?.stack,
        environment: this.config?.environment,
        clientVersion: this.config?.clientVersion,
      };
      try {
        console.error('PhonePe SDK order creation failed:', JSON.stringify(details, null, 2));
      } catch {
        console.error('PhonePe SDK order creation failed:', details);
      }
      throw new Error(`PhonePe SDK order creation failed: ${error?.message || 'unknown error'}`);
    }
  }

  /**
   * Check order status using PhonePe SDK
   * @param {string} orderId - The PhonePe order ID to check status for
   * @returns {Promise<Object>} Order status response
   */
  async checkOrderStatus(orderId) {
    try {
      // Validate input
      const validation = this.validateOrderId(orderId);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize client
      this._initializeClient();

      const cleanOrderId = orderId.trim();

      // Make API call with timeout
      const orderStatus = await this.client.getOrderStatus(cleanOrderId);

      console.log(`PhonePe order status: ${cleanOrderId} - ${orderStatus.state}`);
      return orderStatus;

    } catch (error) {
      console.error(`PhonePe order status check failed for ${orderId}:`, error.message);
      throw new Error(`PhonePe order status check failed: ${error.message}`);
    }
  }

  /**
   * Map PhonePe order state to readable status
   * @param {string} state - PhonePe order state
   * @returns {Object} Mapped status information
   */
  mapOrderState(state) {
    const stateMapping = {
      'PENDING': {
        status: 'pending',
        description: 'Payment is pending',
        userFriendly: 'Payment Pending'
      },
      'COMPLETED': {
        status: 'completed',
        description: 'Payment completed successfully',
        userFriendly: 'Payment Successful'
      },
      'FAILED': {
        status: 'failed',
        description: 'Payment failed',
        userFriendly: 'Payment Failed'
      },
      'CANCELLED': {
        status: 'cancelled',
        description: 'Payment was cancelled',
        userFriendly: 'Payment Cancelled'
      },
      'EXPIRED': {
        status: 'expired',
        description: 'Payment session expired',
        userFriendly: 'Payment Expired'
      }
    };

    return stateMapping[state] || {
      status: 'unknown',
      description: `Unknown state: ${state}`,
      userFriendly: 'Unknown Status'
    };
  }

  /**
   * Get enhanced order status with mapping
   * @param {string} orderId - The PhonePe order ID to check status for
   * @returns {Promise<Object>} Enhanced order status response
   */
  async getEnhancedOrderStatus(orderId) {
    try {
      const response = await this.checkOrderStatus(orderId);
      const mappedState = this.mapOrderState(response.state);

      return {
        ...response,
        mappedStatus: mappedState,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
const phonePeService = new PhonePeService();
module.exports = phonePeService;
