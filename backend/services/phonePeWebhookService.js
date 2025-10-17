const { getPhonePeClient } = require("../config/phonepe");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { WebhookErrorHandler } = require("../utils/webhookErrorHandler");
const NotificationManager = require("./NotificationManager");

/**
 * PhonePe Webhook Service
 * Handles webhook validation, processing, and business logic integration
 */
class PhonePeWebhookService {
  constructor() {
    this.client = null;
    this.callbackCredentials = {
      username: process.env.PHONEPE_CALLBACK_USERNAME,
      password: process.env.PHONEPE_CALLBACK_PASSWORD,
    };

    // Validate callback credentials
    if (
      !this.callbackCredentials.username ||
      !this.callbackCredentials.password
    ) {
      console.warn("PhonePe callback credentials not configured");
    }
  }

  /**
   * Initialize PhonePe client
   * @private
   */
  _initializeClient() {
    if (!this.client) {
      this.client = getPhonePeClient();
    }
    return this.client;
  }

  /**
   * Validate webhook callback using PhonePe SDK
   * @param {string} authorization - Authorization header from request
   * @param {string} responseBody - Raw request body as string
   * @returns {Promise<Object>} Validation result with callback data
   */
  async validateWebhookCallback(authorization, responseBody) {
    try {
      this._initializeClient();

      if (!authorization) {
        throw new Error("Authorization header is missing");
      }

      if (!responseBody) {
        throw new Error("Request body is empty");
      }

      if (
        !this.callbackCredentials.username ||
        !this.callbackCredentials.password
      ) {
        throw new Error("Callback credentials not configured");
      }

      // Use SDK's validateCallback method
      const callbackResponse = await this.client.validateCallback(
        this.callbackCredentials.username,
        this.callbackCredentials.password,
        authorization,
        responseBody
      );

      return {
        isValid: true,
        callbackResponse,
      };
    } catch (error) {
      const webhookError = WebhookErrorHandler.handlePhonePeError(
        error,
        "webhook validation"
      );
      console.error("Webhook validation failed:", webhookError.message);
      return {
        isValid: false,
        error: webhookError.message,
        code: webhookError.code,
      };
    }
  }

  /**
   * Extract and validate callback data from payload
   * @param {Object} payload - Callback payload from PhonePe
   * @returns {Object} Extracted callback data
   */
  extractCallbackData(payload) {
    return {
      // Core identifiers
      merchantId: payload.merchantId,
      orderId: payload.orderId,
      originalMerchantOrderId: payload.originalMerchantOrderId,
      transactionId: payload.transactionId,

      // Refund specific
      refundId: payload.refundId,
      merchantRefundId: payload.merchantRefundId,

      // Transaction details
      state: payload.state,
      amount: payload.amount, // Amount in paisa
      amountInRupees: payload.amount ? payload.amount / 100 : 0,

      // Timestamps
      expireAt: payload.expireAt,
      timestamp: payload.timestamp,

      // Error information
      errorCode: payload.errorCode,
      detailedErrorCode: payload.detailedErrorCode,

      // Additional data
      metaInfo: payload.metaInfo,
      paymentDetails: payload.paymentDetails || [],
    };
  }

  /**
   * Process payment details from callback
   * @param {Array} paymentDetails - Payment details array
   * @returns {Array} Processed payment details
   */
  processPaymentDetails(paymentDetails) {
    if (!Array.isArray(paymentDetails)) {
      return [];
    }

    return paymentDetails.map((detail) => {
      // Validate and normalize payment mode
      let paymentMode = detail.paymentMode || "UPI";

      // Map common PhonePe payment modes to our enum values
      const paymentModeMap = {
        UPI_COLLECT: "UPI_COLLECT",
        UPI_QR: "UPI_QR",
        UPI: "UPI",
        CREDIT_CARD: "CREDIT_CARD",
        DEBIT_CARD: "DEBIT_CARD",
        NET_BANKING: "NET_BANKING",
        WALLET: "WALLET",
        EMI: "EMI",
        PAY_LATER: "PAY_LATER",
        CASH: "CASH",
      };

      // Use mapped value or default to UPI for unknown modes
      paymentMode = paymentModeMap[paymentMode] || "UPI";

      return {
        transactionId: detail.transactionId || null,
        paymentMode: paymentMode,
        timestamp: detail.timestamp || new Date(),
        state: detail.state || "PENDING",
        errorCode: detail.errorCode || null,
        detailedErrorCode: detail.detailedErrorCode || null,
        amount: detail.amount || 0,
        amountInRupees: detail.amount ? detail.amount / 100 : 0,
      };
    });
  }

  /**
   * Handle CHECKOUT_ORDER_COMPLETED callback
   * @param {Object} callbackData - Extracted callback data
   * @returns {Promise<Object>} Processing result
   */
  async handleOrderCompleted(callbackData) {
    try {
      // Find order by phonepeOrderId or originalMerchantOrderId
      const query = {
        $or: [
          { phonepeOrderId: callbackData.orderId },
          { transactionId: callbackData.orderId },
          { _id: callbackData.originalMerchantOrderId },
        ],
      };

      const order = await Order.findOne(query);

      if (!order) {
        console.warn(`Order not found for completed payment: ${callbackData.orderId}`);
        return {
          success: false,
          message: "Order not found",
          orderId: callbackData.orderId,
        };
      }

      // Create or update payment record
      let payment = await Payment.findOne({
        phonepeOrderId: callbackData.orderId,
      });

      if (!payment) {
        // Create new payment record
        payment = new Payment({
          orderId: order._id,
          phonepeOrderId: callbackData.orderId,
          phonepeTransactionId: callbackData.transactionId || null,
          merchantId: callbackData.merchantId,
          status: "Completed",
          amount: callbackData.amountInRupees,
          completedAt: new Date(),
          callbackType: "CHECKOUT_ORDER_COMPLETED",
          paymentDetails: this.processPaymentDetails(
            callbackData.paymentDetails
          ),
          webhookData: callbackData,
        });
      } else {
        // Update existing payment record
        payment.status = "Completed";
        payment.completedAt = new Date();
        payment.phonepeTransactionId = callbackData.transactionId || null;
        payment.paymentDetails = this.processPaymentDetails(
          callbackData.paymentDetails
        );
        payment.webhookData = callbackData;
      }

      await payment.save();

      // Update order status
      const previousStatus = order.status;
      const previousPaymentStatus = order.paymentStatus;

      order.status = "Processing";
      order.paymentStatus = "Paid";
      order.transactionId = callbackData.transactionId;
      order.phonepeOrderId = callbackData.orderId;

      await order.save();

      console.log(`Order ${order._id} completed: ${previousStatus} → Processing, Payment ${previousPaymentStatus} → Paid`);

      // Send push notification for successful payment (Pending → Processing) - Non-blocking
      NotificationManager.sendNotification('order', order._id, 'processing', 'webhook', {
        additionalData: {
          previousStatus,
          paymentAmount: callbackData.amountInRupees,
          transactionId: callbackData.transactionId
        }
      });

      // TODO: Trigger additional business logic
      await this._triggerPostPaymentActions(order, callbackData, payment);

      return {
        success: true,
        message: "Order completed successfully",
        orderId: order._id,
        paymentId: payment._id,
        previousStatus,
        newStatus: "Processing",
        previousPaymentStatus,
        newPaymentStatus: "Paid",
      };
    } catch (error) {
      console.error("Error handling completed order:", error.message);
      throw error;
    }
  }

  /**
   * Handle CHECKOUT_ORDER_FAILED callback
   * @param {Object} callbackData - Extracted callback data
   * @returns {Promise<Object>} Processing result
   */
  async handleOrderFailed(callbackData) {
    try {

      // Find order by phonepeOrderId or originalMerchantOrderId
      const query = {
        $or: [
          { phonepeOrderId: callbackData.orderId },
          { transactionId: callbackData.orderId },
          { _id: callbackData.originalMerchantOrderId },
        ],
      };

      const order = await Order.findOne(query);

      if (!order) {
        console.error(
          `Order not found for failed payment: ${callbackData.orderId}`
        );
        return {
          success: false,
          message: "Order not found",
          orderId: callbackData.orderId,
          errorCode: "ORDER_NOT_FOUND",
        };
      }

      // Validate that the order amount matches the callback amount
      if (order.total !== callbackData.amountInRupees) {
        console.warn(
          `Amount mismatch for order ${order._id}: Order=${order.total}, Callback=${callbackData.amountInRupees}`
        );
      }

      // Create or update payment record
      let payment = await Payment.findOne({
        phonepeOrderId: callbackData.orderId,
      });

      if (!payment) {
        // Create new payment record for failed payment
        payment = new Payment({
          orderId: order._id,
          phonepeOrderId: callbackData.orderId,
          phonepeTransactionId: callbackData.transactionId || null,
          merchantId: callbackData.merchantId,
          status: "Failed",
          amount: callbackData.amountInRupees || order.total,
          failedAt: new Date(),
          errorCode: callbackData.errorCode || "PAYMENT_FAILED",
          detailedErrorCode: callbackData.detailedErrorCode || "UNKNOWN_ERROR",
          errorMessage: this._getErrorMessage(
            callbackData.errorCode,
            callbackData.detailedErrorCode
          ),
          callbackType: "CHECKOUT_ORDER_FAILED",
          paymentDetails: this.processPaymentDetails(
            callbackData.paymentDetails || []
          ),
          webhookData: callbackData,
        });
      } else {
        // Update existing payment record
        // Only update if not already in a final state (avoid overwriting completed payments)
        if (payment.status === "Pending" || payment.status === "Failed") {
          payment.status = "Failed";
          payment.failedAt = new Date();
          payment.errorCode = callbackData.errorCode || "PAYMENT_FAILED";
          payment.detailedErrorCode =
            callbackData.detailedErrorCode || "UNKNOWN_ERROR";
          payment.errorMessage = this._getErrorMessage(
            callbackData.errorCode,
            callbackData.detailedErrorCode
          );
          payment.paymentDetails = this.processPaymentDetails(
            callbackData.paymentDetails || []
          );
          payment.webhookData = callbackData;
        } else {
          console.warn(
            `Payment ${payment._id} already ${payment.status}, not updating to Failed`
          );
        }
      }

      await payment.save();

      // Update order status - only if not already in a final successful state
      const previousStatus = order.status;
      const previousPaymentStatus = order.paymentStatus;

      // Don't overwrite orders that are already successfully processing
      if (!["Processing", "Shipped", "Delivered"].includes(order.status)) {
        order.status = "Payment Failed";
        order.paymentStatus = "Failed";
        order.transactionId = callbackData.transactionId || order.transactionId;
        order.phonepeOrderId = callbackData.orderId;

        await order.save();

        console.log(`Order ${order._id} failed: ${previousStatus} → Payment Failed, Payment ${previousPaymentStatus} → Failed`);
        
        // Send push notification for failed payment - Non-blocking
        NotificationManager.sendNotification('order', order._id, 'failed', 'webhook', {
          additionalData: {
            previousStatus,
            errorCode: callbackData.errorCode,
            errorMessage: payment.errorMessage,
            paymentAmount: callbackData.amountInRupees || order.total
          }
        });
      } else {
        console.warn(`Order ${order._id} already ${order.status}, not updating to Failed`);
      }

      // TODO: Handle failed payment (send notification, restore inventory, etc.)
      await this._handleFailedPayment(order, callbackData, payment);

      return {
        success: true,
        message: "Order failure recorded",
        orderId: order._id,
        paymentId: payment._id,
        previousStatus,
        newStatus: "Payment Failed",
        previousPaymentStatus,
        newPaymentStatus: "Failed",
      };
    } catch (error) {
      console.error("Error handling failed order:", error.message);
      throw error;
    }
  }

  /**
   * Handle refund-related callbacks
   * @param {string} callbackType - Type of refund callback
   * @param {Object} callbackData - Extracted callback data
   * @returns {Promise<Object>} Processing result
   */
  async handleRefundCallback(callbackType, callbackData) {
    try {

      // Find payment record by phonepe order ID
      const payment = await Payment.findOne({
        phonepeOrderId: callbackData.orderId,
      });

      if (!payment) {
        console.warn(`Payment not found for refund: ${callbackData.refundId}`);
        return {
          success: false,
          message: "Payment not found for refund",
          refundId: callbackData.refundId,
        };
      }

      // Find order
      const order = await Order.findById(payment.orderId);
      if (!order) {
        console.warn(`Order not found for payment: ${payment.orderId}`);
        return {
          success: false,
          message: "Order not found for payment",
          refundId: callbackData.refundId,
        };
      }

      // Check if refund already exists
      const existingRefund = payment.refunds.find(
        (r) => r.refundId === callbackData.refundId
      );

      if (!existingRefund) {
        // Create new refund record
        const refundData = {
          refundId: callbackData.refundId,
          merchantRefundId: callbackData.merchantRefundId,
          amount: callbackData.amountInRupees,
        };

        // Set initial status based on callback type
        switch (callbackType) {
          case "PG_REFUND_ACCEPTED":
            refundData.status = "Accepted";
            refundData.acceptedAt = new Date();
            break;
          case "PG_REFUND_COMPLETED":
            refundData.status = "Completed";
            refundData.completedAt = new Date();
            break;
          case "PG_REFUND_FAILED":
            refundData.status = "Failed";
            refundData.failedAt = new Date();
            refundData.errorCode = callbackData.errorCode;
            refundData.detailedErrorCode = callbackData.detailedErrorCode;
            break;
        }

        await payment.addRefund(refundData);
      } else {
        // Update existing refund status
        const errorData = callbackData.errorCode
          ? {
              errorCode: callbackData.errorCode,
              detailedErrorCode: callbackData.detailedErrorCode,
            }
          : null;

        const statusMap = {
          PG_REFUND_ACCEPTED: "Accepted",
          PG_REFUND_COMPLETED: "Completed",
          PG_REFUND_FAILED: "Failed",
        };

        await payment.updateRefundStatus(
          callbackData.refundId,
          statusMap[callbackType],
          errorData
        );
      }

      // Update order payment status based on refunds
      const totalRefunded = payment.totalRefundedAmount;
      let newPaymentStatus = order.paymentStatus;

      if (totalRefunded >= payment.amount) {
        newPaymentStatus = "Refunded";
      } else if (totalRefunded > 0) {
        newPaymentStatus = "Partially_Refunded";
      }

      if (newPaymentStatus !== order.paymentStatus) {
        order.paymentStatus = newPaymentStatus;
        await order.save();
        console.log(`Order ${order._id} payment status: ${newPaymentStatus}`);
      }

      const refundRecord = payment.refunds.find(
        (r) => r.refundId === callbackData.refundId
      );

      console.log(`Refund ${callbackData.refundId}: ${refundRecord.status}`);

      return {
        success: true,
        message: `Refund ${refundRecord.status.toLowerCase()}`,
        orderId: order._id,
        paymentId: payment._id,
        refundId: callbackData.refundId,
        status: refundRecord.status,
        totalRefundedAmount: payment.totalRefundedAmount,
        remainingAmount: payment.remainingAmount,
      };
    } catch (error) {
      console.error("Error handling refund callback:", error.message);
      throw error;
    }
  }

  /**
   * Route callback to appropriate handler based on type
   * @param {Object} callbackResponse - Validated callback response
   * @returns {Promise<Object>} Processing result
   */
  async processCallback(callbackResponse) {
    try {
      const callbackType = callbackResponse.type;
      const callbackData = this.extractCallbackData(callbackResponse.payload);

      console.log(`Processing ${callbackType} for order ${callbackData.orderId}`);

      // Validate callback data before processing
      const validation = this.validateCallbackData(callbackData, callbackType);
      if (!validation.isValid) {
        console.error(`Callback data validation failed:`, validation.errors);
        return {
          success: false,
          message: `Invalid callback data: ${validation.errors.join(", ")}`,
          callbackType,
          errors: validation.errors,
        };
      }

      // Use sanitized data
      const sanitizedCallbackData = validation.sanitizedData;

      let result;
      // Use string values instead of enum constants since callbackType is a string
      switch (callbackType) {
        case "CHECKOUT_ORDER_COMPLETED":
          result = await this.handleOrderCompleted(sanitizedCallbackData);
          break;

        case "CHECKOUT_ORDER_FAILED":
          result = await this.handleOrderFailed(sanitizedCallbackData);
          break;

        case "PG_REFUND_COMPLETED":
        case "PG_REFUND_FAILED":
        case "PG_REFUND_ACCEPTED":
          result = await this.handleRefundCallback(
            callbackType,
            sanitizedCallbackData
          );
          break;

        default:
          console.warn(`Unhandled callback type: ${callbackType}`);
          result = {
            success: false,
            message: `Unhandled callback type: ${callbackType}`,
            callbackType,
            receivedData: {
              type: callbackType,
              orderId: callbackData.orderId,
              state: callbackData.state,
            },
          };
      }

      return result;
    } catch (error) {
      console.error("Error processing callback:", error.message);
      throw error;
    }
  }

  /**
   * Validate webhook callback data integrity
   * @param {Object} callbackData - Extracted callback data
   * @param {string} callbackType - Type of callback
   * @returns {Object} Validation result
   */
  validateCallbackData(callbackData, callbackType) {
    const errors = [];
    // Common validations
    if (!callbackData.orderId) {
      errors.push("Missing orderId");
    }

    if (!callbackData.merchantId) {
      errors.push("Missing merchantId");
    }

    // Type-specific validations
    switch (callbackType) {
      case "CHECKOUT_ORDER_COMPLETED":
        if (!callbackData.amountInRupees || callbackData.amountInRupees <= 0) {
          errors.push("Invalid or missing amount for completed payment");
        }
        // if (!callbackData.transactionId) {
        //   errors.push("Missing transactionId for completed payment");
        // }
        break;

      case "CHECKOUT_ORDER_FAILED":
        // For failed payments, amount might be 0 and transactionId might be missing
        if (callbackData.amountInRupees < 0) {
          errors.push("Negative amount in failed payment");
        }
        if (!callbackData.errorCode) {
          console.warn("Failed payment without error code - using default");
          callbackData.errorCode = "PAYMENT_FAILED";
        }
        break;

      case "PG_REFUND_COMPLETED":
      case "PG_REFUND_FAILED":
      case "PG_REFUND_ACCEPTED":
        if (!callbackData.refundId) {
          errors.push("Missing refundId for refund callback");
        }
        if (!callbackData.amountInRupees || callbackData.amountInRupees <= 0) {
          errors.push("Invalid refund amount");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: callbackData,
    };
  }

  /**
   * Check if webhook is duplicate based on transaction ID and timestamp
   * @param {Object} callbackData - Callback data
   * @returns {Promise<boolean>} True if duplicate
   */
  async isDuplicateWebhook(callbackData) {
    try {
      // Enhanced duplicate detection for failed payments
      const cacheKey = `webhook_${callbackData.orderId}_${
        callbackData.timestamp || Date.now()
      }`;

      // For failed payments, also check if we've already processed a failure for this order
      if (callbackData.state === "FAILED") {
        const existingPayment = await Payment.findOne({
          phonepeOrderId: callbackData.orderId,
          status: "Failed",
        });

        if (existingPayment) {
          // Check if webhook data is identical (same error codes)
          const existingWebhookData = existingPayment.webhookData;
          if (
            existingWebhookData &&
            existingWebhookData.errorCode === callbackData.errorCode &&
            existingWebhookData.detailedErrorCode ===
              callbackData.detailedErrorCode
          ) {
            console.log(`Duplicate failed payment webhook: ${callbackData.orderId}`);
            return true;
          }
        }
      }

      // Simple implementation - could be enhanced with Redis or database tracking
      // For now, just return false for other cases
      return false;
    } catch (error) {
      console.error("Error checking duplicate webhook:", error.message);
      return false; // Default to processing to avoid missing legitimate webhooks
    }
  }

  /**
   * Get human-readable error message from error codes
   * @param {string} errorCode - Main error code
   * @param {string} detailedErrorCode - Detailed error code
   * @returns {string} Human-readable error message
   * @private
   */
  _getErrorMessage(errorCode, detailedErrorCode) {
    const errorMessages = {
      // Payment Processing Errors
      PAYMENT_ERROR: "Payment processing failed",
      PAYMENT_FAILED: "Payment could not be processed",
      TRANSACTION_DECLINED: "Transaction was declined by bank",
      TRANSACTION_FAILED: "Transaction processing failed",

      // Account/Fund Related
      INSUFFICIENT_FUNDS: "Insufficient funds in account",
      ACCOUNT_BLOCKED: "Payment account is blocked",
      DAILY_LIMIT_EXCEEDED: "Daily transaction limit exceeded",
      MONTHLY_LIMIT_EXCEEDED: "Monthly transaction limit exceeded",

      // Card Related
      CARD_EXPIRED: "Payment card has expired",
      INVALID_CARD: "Invalid card details provided",
      CARD_BLOCKED: "Payment card is blocked",
      CARD_NOT_SUPPORTED: "Card type not supported",

      // Technical Errors
      NETWORK_ERROR: "Network connection error",
      TIMEOUT_ERROR: "Payment request timed out",
      GATEWAY_ERROR: "Payment gateway error",
      SYSTEM_ERROR: "System processing error",
      CONFIGURATION_ERROR: "Payment configuration error",

      // User Actions
      USER_CANCELLED: "Payment was cancelled by user",
      USER_TIMEOUT: "Payment session expired",
      INVALID_PIN: "Invalid PIN entered",
      MAX_PIN_ATTEMPTS: "Maximum PIN attempts exceeded",

      // Bank/UPI Specific
      BANK_ERROR: "Bank processing error",
      BANK_UNAVAILABLE: "Bank services unavailable",
      UPI_ERROR: "UPI payment failed",
      UPI_DECLINED: "UPI payment declined",
      VPA_NOT_FOUND: "UPI ID not found",

      // Business Logic
      MERCHANT_ERROR: "Merchant configuration error",
      INVALID_AMOUNT: "Invalid payment amount",
      ORDER_EXPIRED: "Payment order has expired",
      DUPLICATE_ORDER: "Duplicate order detected",

      // Authentication
      AUTHENTICATION_FAILED: "Payment authentication failed",
      OTP_FAILED: "OTP verification failed",
      BIOMETRIC_FAILED: "Biometric authentication failed",

      // Compliance/Risk
      RISK_CHECK_FAILED: "Payment blocked by risk checks",
      COMPLIANCE_ERROR: "Compliance verification failed",
      FRAUD_DETECTED: "Potential fraud detected",

      // Default fallbacks
      UNKNOWN_ERROR: "Unknown payment error occurred",
      GENERAL_ERROR: "Payment processing error",
    };

    const mainMessage =
      errorMessages[errorCode] || errorMessages["UNKNOWN_ERROR"];

    if (detailedErrorCode && detailedErrorCode !== errorCode) {
      const detailedMessage = errorMessages[detailedErrorCode];
      if (detailedMessage && detailedMessage !== mainMessage) {
        return `${mainMessage} - ${detailedMessage}`;
      }
      return `${mainMessage} (Code: ${detailedErrorCode})`;
    }

    return mainMessage;
  }

  /**
   * Trigger post-payment actions (notifications, inventory, etc.)
   * @param {Object} order - Updated order
   * @param {Object} callbackData - Callback data
   * @param {Object} payment - Payment record
   * @private
   */
  async _triggerPostPaymentActions(order, callbackData, payment) {
    try {
      // TODO: Implement your business logic here

      // 1. Send confirmation email/SMS to customer
      // await this._sendPaymentConfirmation(order, payment);

      // 2. Update inventory if applicable
      // await this._updateInventory(order);

      // 3. Trigger fulfillment process
      // await this._triggerFulfillment(order);

      // 4. Send admin notification
      // await this._sendAdminNotification(order, payment);

      console.log(`Post-payment actions triggered for order ${order._id}`);
    } catch (error) {
      console.error("Error in post-payment actions:", error.message);
      // Don't throw - webhook should still succeed even if post actions fail
    }
  }

  /**
   * Handle failed payment cleanup and business logic
   * @param {Object} order - Order with failed payment
   * @param {Object} callbackData - Callback data
   * @param {Object} payment - Payment record
   * @private
   */
  async _handleFailedPayment(order, callbackData, payment) {
    try {
      // 1. Restore inventory if reserved
      // await this._restoreInventory(order);

      // 2. Clear any temporary holds or locks  
      // await this._clearTemporaryHolds(order);

      // 3. Send failure notification to customer
      // await this._sendPaymentFailureNotification(order, payment, callbackData);

      // 4. Send admin alert for critical errors
      if (this._isCriticalPaymentError(callbackData.errorCode)) {
        // await this._sendAdminAlert(order, payment, callbackData);
        console.log(`Critical payment error for order ${order._id}: ${callbackData.errorCode}`);
      }

      // 5. Update metrics/analytics (if implemented)
      // await this._updateFailureMetrics({...});

    } catch (error) {
      console.error(`Error in failed payment handling for order ${order._id}: ${error.message}`);
      // Don't throw - we don't want to fail the webhook because of business logic errors
    }
  }

  /**
   * Check if error code indicates a critical payment system issue
   * @param {string} errorCode - Error code from PhonePe
   * @returns {boolean} True if critical error
   * @private
   */
  _isCriticalPaymentError(errorCode) {
    const criticalErrors = [
      "PAYMENT_GATEWAY_ERROR",
      "SYSTEM_ERROR",
      "CONFIGURATION_ERROR",
      "MERCHANT_ERROR",
      "AUTHENTICATION_FAILED",
    ];
    return criticalErrors.includes(errorCode);
  }
}

// Export singleton instance
const webhookService = new PhonePeWebhookService();
module.exports = webhookService;
