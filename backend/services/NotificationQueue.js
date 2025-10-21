// backend/services/NotificationQueue.js
const EventEmitter = require("events");
const NotificationService = require("./NotificationService");
const { isValidTopic } = require("../constants/notificationTopics");

/**
 * Enterprise NotificationQueue - High-performance, resilient queue management
 *
 * Features:
 * - Non-blocking queue processing
 * - Priority-based delivery
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern
 * - Batch processing
 * - Dead letter queue
 * - Performance monitoring
 */
class NotificationQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.deadLetterQueue = [];
    this.processing = false;
    this.isInitialized = false;

    // Configuration
    this.config = {
      batchSize: 10,
      processingInterval: 1000, // 1 second
      maxRetries: 3,
      retryDelayBase: 1000, // 1 second base delay
      circuitBreakerThreshold: 10, // failures before circuit opens
      circuitBreakerTimeout: 30000, // 30 seconds
      deadLetterAfterRetries: true,
    };

    // State tracking
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalSent: 0,
      totalFailed: 0,
      totalRetried: 0,
      averageProcessingTime: 0,
      currentBatchSize: 0,
      queueLength: 0,
      deadLetterCount: 0,
    };

    // Circuit breaker
    this.circuitBreaker = {
      failureCount: 0,
      lastFailure: null,
      state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
    };

    this.processingTimer = null;
  }

  /**
   * Initialize the queue
   */
  async initialize() {
    if (this.isInitialized) return { success: true };

    try {
      console.log("🔄 Initializing Enterprise Notification Queue...");

      // Validate NotificationService is available
      if (!NotificationService.isReady()) {
        console.warn(
          "⚠️ NotificationService not ready, queue will retry when available"
        );
      }

      this.startProcessing();
      this.isInitialized = true;

      console.log("✅ Notification Queue initialized");
      console.log(
        `📊 Queue Configuration: batchSize=${this.config.batchSize}, interval=${this.config.processingInterval}ms`
      );

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to initialize Notification Queue:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enqueue notification request (non-blocking)
   */
  enqueue(request) {
    try {
      const queueItem = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.requestId,
        type: request.type,
        trigger: request.trigger,
        notifications: request.notifications, // Array of ready-to-send notifications
        priority: request.priority || "normal",
        delay: request.delay || 0,
        attempts: 0,
        createdAt: new Date(),
        scheduledFor: new Date(Date.now() + (request.delay || 0)),
        metadata: request.metadata || {},
      };

      // Add to queue based on priority
      if (request.priority === "high") {
        this.queue.unshift(queueItem);
      } else {
        this.queue.push(queueItem);
      }

      // Update stats
      this.stats.totalQueued++;
      this.stats.queueLength = this.queue.length;

      console.log(
        `📨 Enqueued: ${queueItem.id} (${request.notifications.length} notifications, priority: ${request.priority})`
      );

      // Emit event
      this.emit("item_queued", {
        queueId: queueItem.id,
        requestId: request.requestId,
        type: request.type,
        notificationCount: request.notifications.length,
        priority: request.priority,
      });

      return {
        success: true,
        queueId: queueItem.id,
        position: this.queue.length,
        estimatedDelay: this._estimateProcessingDelay(),
      };
    } catch (error) {
      console.error("❌ Error enqueueing notification:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Start processing the queue
   */
  startProcessing() {
    if (this.processingTimer) {
      console.log("⚠️ Queue processing already started");
      return;
    }

    this.processingTimer = setInterval(async () => {
      if (!this.processing && this.queue.length > 0 && this._canProcess()) {
        await this.processQueue();
      }
    }, this.config.processingInterval);

    console.log("🔄 Queue processing started");
  }

  /**
   * Stop processing the queue
   */
  stopProcessing() {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
      console.log("⏹️ Queue processing stopped");
    }
  }

  /**
   * Process queue items in batches
   */
  async processQueue() {
    if (this.processing) return;

    this.processing = true;
    const startTime = Date.now();

    try {
      // Get items ready for processing
      const readyItems = this.queue.filter(
        (item) => item.scheduledFor <= new Date() && this._canProcess()
      );

      if (readyItems.length === 0) {
        this.processing = false;
        return;
      }

      // Process in batches
      const batch = readyItems.slice(0, this.config.batchSize);
      this.stats.currentBatchSize = batch.length;

      console.log(`🔄 Processing batch of ${batch.length} queue items`);

      // Remove processed items from queue
      batch.forEach((item) => {
        const index = this.queue.findIndex((q) => q.id === item.id);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
      });

      // Process each item
      const batchPromises = batch.map((item) => this.processQueueItem(item));
      const results = await Promise.allSettled(batchPromises);

      // Update stats
      this.stats.totalProcessed += batch.length;
      this.stats.queueLength = this.queue.length;

      const processingTime = Date.now() - startTime;
      this._updateProcessingTime(processingTime);

      // Emit batch completion event
      this.emit("queue_processed", {
        batchSize: batch.length,
        processingTime,
        queueRemaining: this.queue.length,
      });
    } catch (error) {
      console.error("❌ Error processing queue:", error);
      this._recordFailure();
    } finally {
      this.processing = false;
      this.stats.currentBatchSize = 0;
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(queueItem) {
    try {
      queueItem.attempts++;
      console.log(
        `📤 Processing queue item: ${queueItem.id} (attempt ${queueItem.attempts})`
      );

      // Process each notification in the item
      const results = [];
      for (const notification of queueItem.notifications) {
        try {
          const result = await this._sendNotification(notification, queueItem);
          results.push(result);

          if (result.success) {
            this.stats.totalSent++;
          } else {
            this.stats.totalFailed++;
          }
        } catch (error) {
          console.error(
            `Error sending notification to user ${notification.userId}:`,
            error
          );
          results.push({
            success: false,
            error: error.message,
            userId: notification.userId,
          });
          this.stats.totalFailed++;
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        console.log(
          `✅ Queue item ${queueItem.id} processed: ${successCount} sent, ${failureCount} failed`
        );
      }

      // If all notifications failed, consider retry
      if (
        failureCount === results.length &&
        queueItem.attempts < this.config.maxRetries
      ) {
        await this._retryQueueItem(queueItem);
      } else if (failureCount > 0 && this.config.deadLetterAfterRetries) {
        this._moveToDeadLetter(
          queueItem,
          `${failureCount} notifications failed after ${queueItem.attempts} attempts`
        );
      }

      // Emit completion event
      this.emit("notification_sent", {
        queueId: queueItem.id,
        requestId: queueItem.requestId,
        successCount,
        failureCount,
        attempts: queueItem.attempts,
      });
    } catch (error) {
      console.error(`❌ Error processing queue item ${queueItem.id}:`, error);

      if (queueItem.attempts < this.config.maxRetries) {
        await this._retryQueueItem(queueItem);
      } else {
        this._moveToDeadLetter(queueItem, error.message);
      }

      this._recordFailure();
    }
  }

  /**
   * Send individual notification
   * @private
   */
  async _sendNotification(notification, queueItem) {
    if (!NotificationService.isReady()) {
      throw new Error("NotificationService not ready");
    }

    // Map trigger to valid source values for NotificationLog
    const sourceMap = {
      'manual': 'manual',
      'admin_action': 'manual',
      'payment_completion': 'triggered',
      'webhook': 'triggered',
      'scheduled': 'scheduled',
      'automated': 'automated',
      'campaign': 'automated',
      'system': 'automated'
    };

    // Get the original trigger/source from queue item
    const originalTrigger = queueItem?.trigger || 'automated';
    const mappedSource = sourceMap[originalTrigger] || 'automated';

    // Check if this is a topic-based notification
    if (notification.deliveryType === 'topic' && notification.topic) {
      // Validate topic before sending
      if (!isValidTopic(notification.topic)) {
        throw new Error(`Invalid topic: ${notification.topic}`);
      }
      
      return await NotificationService.sendTopicNotification({
        topic: notification.topic,
        templateId: notification.templateId,
        variables: notification.variables,
        priority: notification.priority,
        source: mappedSource,
      });
    }

    // Regular individual notification
    return await NotificationService.sendNotification({
      userId: notification.userId,
      templateId: notification.templateId,
      variables: notification.variables,
      priority: notification.priority,
      source: mappedSource,
    });
  }

  /**
   * Retry failed queue item
   * @private
   */
  async _retryQueueItem(queueItem) {
    const retryDelay =
      this.config.retryDelayBase * Math.pow(2, queueItem.attempts - 1); // Exponential backoff
    queueItem.scheduledFor = new Date(Date.now() + retryDelay);

    // Re-add to queue
    this.queue.push(queueItem);
    this.stats.totalRetried++;

    console.log(
      `🔄 Retrying queue item ${queueItem.id} in ${retryDelay}ms (attempt ${
        queueItem.attempts + 1
      })`
    );

    this.emit("notification_retry", {
      queueId: queueItem.id,
      requestId: queueItem.requestId,
      attempt: queueItem.attempts + 1,
      retryDelay,
    });
  }

  /**
   * Move item to dead letter queue
   * @private
   */
  _moveToDeadLetter(queueItem, reason) {
    this.deadLetterQueue.push({
      ...queueItem,
      failedAt: new Date(),
      failureReason: reason,
    });

    this.stats.deadLetterCount = this.deadLetterQueue.length;

    console.error(`💀 Moved to dead letter queue: ${queueItem.id} - ${reason}`);

    this.emit("notification_failed", {
      queueId: queueItem.id,
      requestId: queueItem.requestId,
      reason,
      attempts: queueItem.attempts,
    });
  }

  /**
   * Check if queue can process (circuit breaker)
   * @private
   */
  _canProcess() {
    if (this.circuitBreaker.state === "OPEN") {
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceFailure > this.config.circuitBreakerTimeout) {
        this.circuitBreaker.state = "HALF_OPEN";
        console.log("🔄 Circuit breaker transitioning to HALF_OPEN");
      } else {
        return false; // Still in OPEN state
      }
    }

    return true;
  }

  /**
   * Record failure for circuit breaker
   * @private
   */
  _recordFailure() {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailure = Date.now();

    if (
      this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold
    ) {
      this.circuitBreaker.state = "OPEN";
      console.warn(
        `⚠️ Circuit breaker OPEN due to ${this.circuitBreaker.failureCount} failures`
      );
    }
  }

  /**
   * Record success for circuit breaker
   * @private
   */
  _recordSuccess() {
    if (this.circuitBreaker.state === "HALF_OPEN") {
      this.circuitBreaker.state = "CLOSED";
      this.circuitBreaker.failureCount = 0;
      console.log("✅ Circuit breaker CLOSED");
    }
  }

  /**
   * Update processing time stats
   * @private
   */
  _updateProcessingTime(time) {
    const total =
      this.stats.averageProcessingTime * (this.stats.totalProcessed - 1);
    this.stats.averageProcessingTime =
      (total + time) / this.stats.totalProcessed;
  }

  /**
   * Estimate processing delay
   * @private
   */
  _estimateProcessingDelay() {
    const queuePosition = this.queue.length;
    const batchesAhead = Math.ceil(queuePosition / this.config.batchSize);
    return batchesAhead * this.config.processingInterval;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.processing,
      stats: this.stats,
      circuitBreaker: this.circuitBreaker,
      config: this.config,
      queueLength: this.queue.length,
      deadLetterLength: this.deadLetterQueue.length,
    };
  }

  /**
   * Get notification history
   */
  async getHistory(requestId) {
    // This would typically query a persistent store
    // For now, check current queue and dead letter queue
    const queueItem = this.queue.find((item) => item.requestId === requestId);
    const deadLetterItem = this.deadLetterQueue.find(
      (item) => item.requestId === requestId
    );

    return {
      requestId,
      inQueue: !!queueItem,
      inDeadLetter: !!deadLetterItem,
      queueItem,
      deadLetterItem,
    };
  }

  /**
   * Shutdown the queue gracefully
   */
  async shutdown() {
    console.log("🛑 Shutting down notification queue...");

    this.stopProcessing();

    // Wait for current processing to complete
    while (this.processing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `📊 Final queue stats: ${this.queue.length} items remaining, ${this.deadLetterQueue.length} in dead letter queue`
    );
    this.isInitialized = false;
  }

  /**
   * Clear all queues (emergency use)
   */
  clearAll() {
    const queueCleared = this.queue.length;
    const deadLetterCleared = this.deadLetterQueue.length;

    this.queue = [];
    this.deadLetterQueue = [];
    this.stats.queueLength = 0;
    this.stats.deadLetterCount = 0;

    console.log(
      `🗑️ Cleared ${queueCleared} queue items and ${deadLetterCleared} dead letter items`
    );

    return { queueCleared, deadLetterCleared };
  }
}

// Export singleton instance
module.exports = new NotificationQueue();
