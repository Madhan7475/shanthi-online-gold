// backend/services/NotificationManager.js
const NotificationBuilder = require("./NotificationBuilder");
const NotificationQueue = require("./NotificationQueue");
const EventEmitter = require("events");

/**
 * Enterprise NotificationManager - Single source of truth for all notifications
 *
 * This is the ONLY service that should be called to send notifications from anywhere in the system.
 * It handles template resolution, user targeting, and queue management automatically.
 */
class NotificationManager extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.stats = {
      totalRequests: 0,
      successfulQueued: 0,
      failedToQueue: 0,
      averageProcessingTime: 0,
    };
  }

  /**
   * Initialize the notification manager
   */
  async initialize() {
    if (this.isInitialized) {
      return { success: true, message: "Already initialized" };
    }

    try {
      console.log("🚀 Initializing Enterprise Notification Manager...");

      // Initialize dependencies
      await NotificationBuilder.initialize();
      await NotificationQueue.initialize();

      this.isInitialized = true;
      console.log(
        "✅ Enterprise Notification Manager initialized successfully"
      );

      // Setup event listeners for monitoring
      this._setupEventListeners();

      return { success: true, message: "Notification Manager ready" };
    } catch (error) {
      console.error("❌ Failed to initialize Notification Manager:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * UNIVERSAL METHOD: Send notification - Single entry point for entire system
   *
   * This method intelligently handles different notification patterns:
   * - Order notifications: sendNotification('order', orderId, status, trigger, options)
   * - Cart notifications: sendNotification('cart', userId, event, data, options)
   * - Promotional: sendNotification('promo', templateId, targeting, variables, options)
   * - Generic: sendNotification({ type, trigger, data, recipients, options })
   *
   * @returns {Promise<Object>} Result with queue ID for tracking
   */
  async sendNotification(...args) {
    const startTime = Date.now();

    try {
      // Parse arguments into unified request format
      const request = this._parseArguments(args);
      console.log("Parsed notification request:", request);
      // Input validation
      const validation = this._validateRequest(request);
      console.log("Notification request validation:", validation);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid request: ${validation.errors.join(", ")}`,
          requestId: null,
        };
      }

      // Generate unique request ID for tracking
      const requestId = `notif_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log(
        `📧 Processing notification request: ${requestId} (type: ${request.type})`
      );

      // Step 1: Build the notification (template resolution, variable interpolation, user targeting)
      const buildResult = await NotificationBuilder.buildNotification({
        ...request,
        requestId,
      });

      if (!buildResult.success) {
        return {
          success: false,
          error: `Build failed: ${buildResult.error}`,
          requestId,
        };
      }

      // Step 2: Queue the notification for delivery (non-blocking)
      const queueResult = NotificationQueue.enqueue({
        requestId,
        type: request.type,
        trigger: request.trigger,
        notifications: buildResult.notifications, // Array of ready-to-send notifications
        priority: request.options?.priority || "normal",
        delay: request.options?.delay || 0,
        metadata: {
          originalRequest: request,
          buildMetadata: buildResult.metadata,
          queuedAt: new Date(),
        },
      });

      if (!queueResult.success) {
        return {
          success: false,
          error: `Queue failed: ${queueResult.error}`,
          requestId,
        };
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this._updateStats("success", processingTime);

      console.log(
        `✅ Notification request queued successfully: ${requestId} (${buildResult.notifications.length} notifications)`
      );

      // Emit event for monitoring
      this.emit("notification_queued", {
        requestId,
        type: request.type,
        recipientCount: buildResult.notifications.length,
        processingTime,
        queueId: queueResult.queueId,
      });

      return {
        success: true,
        requestId,
        queueId: queueResult.queueId,
        recipientCount: buildResult.notifications.length,
        processingTime,
        message: "Notification queued for delivery",
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this._updateStats("error", processingTime);

      console.error("❌ Error in sendNotification:", error);

      return {
        success: false,
        error: error.message,
        requestId: null,
      };
    }
  }

  /**
   * Get notification status and stats
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      stats: this.stats,
      builder: NotificationBuilder.getStatus(),
      queue: NotificationQueue.getStatus(),
    };
  }

  /**
   * Get notification history for a request
   */
  async getNotificationHistory(requestId) {
    return NotificationQueue.getHistory(requestId);
  }

  /**
   * Parse different argument patterns into unified request format
   * @private
   */
  _parseArguments(args) {
    // Pattern 1: Object format - sendNotification({ type, trigger, data, recipients, options })
    if (args.length === 1 && typeof args[0] === "object" && args[0].type) {
      return args[0];
    }

    // Pattern 2: Order notifications - sendNotification('order', orderId, status, trigger, options)
    if (args[0] === "order" && args.length >= 3) {
      const [, orderId, status, trigger = "system", options = {}] = args;
      return {
        type: "order_status",
        trigger,
        data: {
          orderId,
          status,
          ...options.additionalData,
        },
        recipients: options.userId, // Will be resolved from order if not provided
        options: {
          priority: "high",
          ...options,
        },
      };
    }

    // Pattern 3: Cart notifications - sendNotification('cart', userId, event, data, options)
    if (args[0] === "cart" && args.length >= 3) {
      const [, userId, event, data = {}, options = {}] = args;
      return {
        type: "cart_event",
        trigger: "automated",
        data: {
          event,
          ...data,
        },
        recipients: [userId],
        options: {
          priority: "normal",
          ...options,
        },
      };
    }

    // Pattern 4: Promotional - sendNotification('promo', templateId, targeting, variables, options)
    if (args[0] === "promo" && args.length >= 3) {
      const [, templateId, targeting, variables = {}, options = {}] = args;
      return {
        type: "promotional",
        trigger: "campaign",
        data: {
          templateId,
          variables,
        },
        recipients: targeting,
        options: {
          priority: "low",
          ...options,
        },
      };
    }

    // Pattern 5: Legacy order format - sendNotification(orderId, status, trigger, options)
    if (
      typeof args[0] === "string" &&
      args.length >= 2 &&
      !["order", "cart", "promo"].includes(args[0])
    ) {
      const [orderId, status, trigger = "system", options = {}] = args;
      return {
        type: "order_status",
        trigger,
        data: {
          orderId,
          status,
          ...options.additionalData,
        },
        recipients: options.userId,
        options: {
          priority: "high",
          ...options,
        },
      };
    }

    // Invalid format
    throw new Error(
      "Invalid arguments format. Use: sendNotification(type, ...args) or sendNotification({...})"
    );
  }

  /**
   * Validate notification request
   * @private
   */
  _validateRequest(request) {
    const errors = [];

    if (!request || typeof request !== "object") {
      errors.push("Request must be an object");
      return { isValid: false, errors };
    }

    if (!request.type) {
      errors.push("Notification type is required");
    }

    if (!request.trigger) {
      errors.push("Trigger is required");
    }

    if (!request.data) {
      errors.push("Data is required");
    }

    if (!request.recipients) {
      errors.push("Recipients are required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update internal stats
   * @private
   */
  _updateStats(result, processingTime) {
    this.stats.totalRequests++;

    if (result === "success") {
      this.stats.successfulQueued++;
    } else {
      this.stats.failedToQueue++;
    }

    // Calculate running average
    const total =
      this.stats.averageProcessingTime * (this.stats.totalRequests - 1);
    this.stats.averageProcessingTime =
      (total + processingTime) / this.stats.totalRequests;
  }

  /**
   * Setup event listeners for monitoring and debugging
   * @private
   */
  _setupEventListeners() {
    NotificationQueue.on("notification_sent", (data) => {
      this.emit("notification_delivered", data);
    });

    NotificationQueue.on("notification_failed", (data) => {
      this.emit("notification_failed", data);
    });

    NotificationQueue.on("queue_processed", (stats) => {
      this.emit("queue_processed", stats);
    });
  }

  /**
   * Shutdown the notification manager gracefully
   */
  async shutdown() {
    if (!this.isInitialized) return;

    console.log("🛑 Shutting down Notification Manager...");

    await NotificationQueue.shutdown();
    this.isInitialized = false;

    console.log("✅ Notification Manager shutdown complete");
  }
}

// Export singleton instance
module.exports = new NotificationManager();
