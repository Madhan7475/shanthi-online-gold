// backend/services/NotificationService.js
const admin = require("../config/firebaseAdmin");
const NotificationTemplate = require("../models/NotificationTemplate");
const UserDevice = require("../models/UserDevice");
const NotificationLog = require("../models/NotificationLog");
const TopicNotificationLog = require("../models/TopicNotificationLog");
const NotificationCampaign = require("../models/NotificationCampaign");
const { v4: uuidv4 } = require("uuid");
const {
  NOTIFICATION_TOPICS,
  getTopicsForPreferences,
  isValidTopic,
} = require("../constants/notificationTopics");

class NotificationService {
  constructor() {
    try {
      this.messaging = admin.messaging();
    } catch (error) {
      console.warn("Firebase Admin messaging not available:", error.message);
      this.messaging = null;
    }
    this.isInitialized = false;

    // Use centralized topic definitions
    this.topics = NOTIFICATION_TOPICS;
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("Initializing Notification Service...");

      // Simple validation - check if Firebase messaging is available
      if (!this.messaging) {
        throw new Error(
          "Firebase messaging not available - check Firebase Admin SDK configuration"
        );
      }

      // Validate Firebase Admin SDK is properly configured
      try {
        if (!admin.apps || !admin.apps.length) {
          throw new Error("Firebase Admin SDK not initialized");
        }

        // Check if we have proper credentials
        const app = admin.app();
        if (!app) {
          throw new Error("Firebase app not available");
        }
      } catch (adminError) {
        throw new Error(`Firebase Admin SDK error: ${adminError.message}`);
      }

      this.isInitialized = true;
      console.log("Notification Service initialized successfully");
      console.log("📱 Firebase messaging ready for notifications");

      return { success: true, message: "Notification service ready" };
    } catch (error) {
      console.error(
        "Failed to initialize Notification Service:",
        error.message
      );
      console.warn("Notification service will be disabled");
      console.warn(
        "To enable notifications, ensure Firebase Admin SDK is properly configured"
      );

      // Don't throw error - allow app to start without notifications
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if notification service is ready to send notifications
   */
  isReady() {
    return this.isInitialized && this.messaging;
  }

  /**
   * Validate Firebase connection without sending actual notification
   */
  async validateConnection() {
    try {
      if (!this.isReady()) {
        return { success: false, message: "Service not initialized" };
      }

      // Just check if messaging object is available - no actual sending
      const hasMessaging = !!this.messaging;

      return {
        success: hasMessaging,
        message: hasMessaging
          ? "Firebase messaging available"
          : "Firebase messaging not available",
      };
    } catch (error) {
      return {
        success: false,
        message: "Connection validation failed",
        error: error.message,
      };
    }
  }

  /**
   * Register or update user device for notifications
   * Handles multiple scenarios:
   * 1. New device registration
   * 2. User logout/login on same device (transfers device ownership)
   * 3. FCM token updates
   * 4. Device reactivation
   */
  async registerDevice({
    userId,
    fcmToken,
    platform,
    deviceId,
    appVersion,
    osVersion,
    deviceModel,
    manufacturer,
    locale,
    timezone,
  }) {
    try {
      // Device registration works independently of notification service status
      // This allows users to register devices even if notifications are disabled

      // Step 1: Check for exact match (same user + device + token) - prevent duplicates
      let device = await UserDevice.findOne({
        userId,
        "deviceInfo.deviceId": deviceId,
        fcmToken,
      });

      if (device) {
        // Exact match found - reset token status and update timestamps
        device.lastActiveAt = new Date();
        device.tokenUpdatedAt = new Date();
        device.isActive = true;

        // Reset token status to healthy state (crucial for re-enabling notifications)
        device.markTokenHealthy();

        await device.save();

        // Clean up any duplicate entries for this user+device combination
        await UserDevice.deleteMany({
          userId,
          "deviceInfo.deviceId": deviceId,
          _id: { $ne: device._id }, // Keep the current one, delete others
        });

        console.log(
          `Device already registered: ${deviceId} for user ${userId} - updated timestamp and cleaned duplicates`
        );
        return {
          success: true,
          message: "Device already registered - updated",
          deviceId: device._id,
          isNewDevice: false,
          userTransferred: false,
          tokenUpdated: false,
          isDuplicate: true,
        };
      }

      // Step 2: Check if this FCM token is used by a different device
      const existingTokenDevice = await UserDevice.findOne({
        fcmToken,
        "deviceInfo.deviceId": { $ne: deviceId }, // Different device with same token
      });

      if (existingTokenDevice) {
        // Deactivate old device with same FCM token
        existingTokenDevice.isActive = false;
        existingTokenDevice.deactivatedAt = new Date();
        await existingTokenDevice.save();
        console.log(
          `Deactivated old device ${existingTokenDevice.deviceInfo.deviceId} due to FCM token conflict`
        );
      }

      // Step 3: Check if this specific device exists for a different user or with different token
      device = await UserDevice.findOne({ "deviceInfo.deviceId": deviceId });

      if (device) {
        // Device exists with different user or token - handle transfer/update
        const previousUserId = device.userId;
        const previousToken = device.fcmToken;

        // Update device with new user and/or token
        device.userId = userId;
        device.fcmToken = fcmToken;
        device.deviceInfo.platform = platform;
        device.deviceInfo.deviceId = deviceId;
        device.deviceInfo.appVersion = appVersion;
        device.deviceInfo.osVersion = osVersion;
        device.deviceInfo.deviceModel = deviceModel;
        device.deviceInfo.manufacturer = manufacturer;
        device.deviceInfo.locale = locale;
        device.deviceInfo.timezone = timezone;
        device.lastActiveAt = new Date();
        device.isActive = true;
        device.tokenUpdatedAt = new Date();

        // Reset token status to healthy state (crucial for re-enabling notifications)
        device.markTokenHealthy();

        // If user changed, record the transfer
        if (previousUserId !== userId) {
          device.previousUserId = previousUserId;
          device.userTransferredAt = new Date();
          console.log(
            `Device ${deviceId} transferred from user ${previousUserId} to ${userId}`
          );
        }

        // If FCM token changed, record the update
        if (previousToken !== fcmToken) {
          device.previousFcmToken = previousToken;
          console.log(`FCM token updated for device ${deviceId}`);
        }
      } else {
        // Step 4: Create new device registration
        device = new UserDevice({
          userId,
          fcmToken,
          deviceInfo: {
            platform,
            deviceId,
            appVersion,
            osVersion,
            deviceModel,
            manufacturer,
            locale,
            timezone,
          },
          registeredAt: new Date(),
          tokenUpdatedAt: new Date(),
        });
        console.log(`New device registered: ${deviceId} for user ${userId}`);
      }

      await device.save();

      // Final cleanup: Remove any remaining duplicates for this user+device combination
      const duplicatesRemoved = await UserDevice.deleteMany({
        userId,
        "deviceInfo.deviceId": deviceId,
        _id: { $ne: device._id }, // Keep the current one, delete others
      });

      if (duplicatesRemoved.deletedCount > 0) {
        console.log(
          `Cleaned up ${duplicatesRemoved.deletedCount} duplicate entries for device ${deviceId}`
        );
      }

      // Auto-subscribe to Firebase topics based on preferences and user segment
      try {
        const userSegment = device.userSegment;
        const topicSubscriptionResult = await this.manageTopicSubscriptions(
          fcmToken,
          device.preferences,
          userSegment,
          platform
        );

        console.log(
          `Topic subscriptions for device ${deviceId}: ${topicSubscriptionResult.totalSubscribed} successful, ${topicSubscriptionResult.totalErrors} errors`
        );
      } catch (topicError) {
        console.warn(
          `Failed to manage topic subscriptions for device ${deviceId}:`,
          topicError.message
        );
        // Don't fail device registration due to topic subscription errors
      }

      return {
        success: true,
        message: "Device registered successfully",
        deviceId: device._id,
        isNewDevice: !device.previousUserId,
        userTransferred:
          device.previousUserId && device.previousUserId !== userId,
        tokenUpdated:
          device.previousFcmToken && device.previousFcmToken !== fcmToken,
      };
    } catch (error) {
      console.error("Error in registerDevice:", error);
      return {
        success: false,
        message: "Failed to register device",
        error: error.message,
      };
    }
  }

  /**
   * Deregister device when user logs out
   * Options:
   * - soft: Keep device record but mark as inactive (default)
   * - hard: Completely remove device record
   */
  async deregisterDevice(deviceId, options = { type: "soft" }) {
    try {
      if (options.type === "hard") {
        // Completely remove the device using deviceInfo.deviceId
        const result = await UserDevice.findOneAndDelete({
          "deviceInfo.deviceId": deviceId,
        });
        if (result) {
          console.log(`🗑️ Hard deleted device: ${deviceId}`);
          return {
            success: true,
            message: "Device completely removed",
          };
        }
      } else {
        // Soft deactivation (recommended) - find by deviceInfo.deviceId
        const device = await UserDevice.findOne({
          "deviceInfo.deviceId": deviceId,
        });
        if (device) {
          device.isActive = false;
          device.deactivatedAt = new Date();
          device.logoutAt = new Date();
          await device.save();

          console.log(
            `Soft deactivated device: ${deviceId} for user: ${device.userId}`
          );
          return {
            success: true,
            message: "Device deactivated successfully",
          };
        }
      }

      return {
        success: false,
        message: "Device not found",
      };
    } catch (error) {
      console.error("Error in deregisterDevice:", error);
      return {
        success: false,
        message: "Failed to deregister device",
        error: error.message,
      };
    }
  }

  /**
   * Update FCM token for existing device
   */
  async updateFCMToken(deviceId, newFcmToken) {
    try {
      const device = await UserDevice.findOne({
        "deviceInfo.deviceId": deviceId,
      });
      if (!device) {
        return {
          success: false,
          message: "Device not found",
        };
      }

      // Check if new token is already used by another device
      const conflictDevice = await UserDevice.findOne({
        fcmToken: newFcmToken,
        "deviceInfo.deviceId": { $ne: deviceId },
      });

      if (conflictDevice) {
        // Deactivate conflicting device
        conflictDevice.isActive = false;
        conflictDevice.deactivatedAt = new Date();
        await conflictDevice.save();
        console.log(`Deactivated conflicting device due to FCM token transfer`);
      }

      // Store previous token for tracking
      device.previousFcmToken = device.fcmToken;
      device.fcmToken = newFcmToken;
      device.tokenUpdatedAt = new Date();
      device.lastActiveAt = new Date();

      // Reset token status to healthy state (crucial for re-enabling notifications)
      device.markTokenHealthy();

      await device.save();

      console.log(`FCM token updated for device: ${deviceId}`);
      return {
        success: true,
        message: "FCM token updated successfully",
      };
    } catch (error) {
      console.error("Error updating FCM token:", error);
      return {
        success: false,
        message: "Failed to update FCM token",
        error: error.message,
      };
    }
  }

  /**
   * Get all devices for a user (for multi-device management)
   */
  async getUserDevices(userId) {
    try {
      const devices = await UserDevice.find({
        userId,
        isActive: true,
      }).select("-fcmToken -previousFcmToken"); // Don't expose tokens

      return {
        success: true,
        devices: devices,
      };
    } catch (error) {
      console.error("Error getting user devices:", error);
      return {
        success: false,
        message: "Failed to get user devices",
        error: error.message,
      };
    }
  }

  /**
   * Send notification to Firebase topic (for broadcast notifications)
   */
  async sendTopicNotification(options) {
    const {
      topic,
      templateId,
      variables = {},
      priority = "normal",
      source = "automated",
      campaignId = null,
      logDelivery = false, // Optional logging for topic notifications
    } = options;

    const notificationId = uuidv4();

    try {
      // Check if service is ready
      if (!this.isReady()) {
        throw new Error("Notification service not initialized");
      }

      // Validate topic using centralized validation
      if (!isValidTopic(topic)) {
        throw new Error(
          `Invalid topic: ${topic}. Must be one of: ${Object.values(
            NOTIFICATION_TOPICS
          ).join(", ")}`
        );
      }

      // Get notification template
      const template = await NotificationTemplate.findById(templateId);
      if (!template || template.status !== "active") {
        throw new Error("Template not found or inactive");
      }

      // Validate template variables
      const validation = template.validateVariables(variables);
      if (!validation.isValid) {
        throw new Error(
          `Missing required variables: ${validation.missingVariables.join(
            ", "
          )}`
        );
      }

      // Render notification content
      const content = template.render(variables);

      // Prepare FCM topic message
      const renderedAction = content.action || template.action;
      const fcmMessage = {
        topic: topic,
        notification: {
          title: content.title,
          body: content.body,
        },
        data: {
          templateId: template._id.toString(),
          notificationId,
          campaignId: campaignId || "",
          actionType: renderedAction?.type || "none",
          actionValue: renderedAction?.value || "",
          buttonText: renderedAction?.buttonText || "",
          notificationType: "topic",
          source: source,
          variables: JSON.stringify(variables),
        },
        android: {
          priority: priority === "high" ? "high" : "normal",
          notification: {
            imageUrl: template.imageUrl,
            icon: template.iconUrl,
            clickAction: renderedAction?.value,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: "default",
            },
          },
        },
      };

      // Add image for rich notifications
      if (template.imageUrl) {
        fcmMessage.notification.imageUrl = template.imageUrl;
      }

      const startTime = Date.now();

      // Send notification to topic via FCM
      const response = await this.messaging.send(fcmMessage);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Update template stats
      template.stats.totalSent += 1;
      template.stats.lastUsed = new Date();
      await template.save();

      // Optional lightweight logging for topic notifications (enabled by logDelivery flag)
      if (logDelivery) {
        try {
          await TopicNotificationLog.create({
            notificationId,
            campaignId,
            templateId: template._id,
            templateVersion: template.version,
            topic: topic,
            content: {
              title: content.title,
              body: content.body,
              imageUrl: template.imageUrl,
              variables: variables,
            },
            delivery: {
              status: "sent",
              sentAt: new Date(),
              fcmMessageId: response,
            },
            source: source,
            priority: priority,
            performance: {
              processingTime: processingTime,
            },
          });
        } catch (logError) {
          console.warn(
            "Failed to create topic notification log:",
            logError.message
          );
          // Don't fail the notification if logging fails
        }
      }

      console.log(
        `📢 Topic notification sent successfully to "${topic}" (Template: ${template.templateId})`
      );

      return {
        success: true,
        notificationId,
        messageId: response,
        processingTime,
        topic: topic,
        deliveryType: "topic",
        templateId: template.templateId,
        subscriberEstimate: "Unknown (topic-based)", // Firebase doesn't provide subscriber counts
        logged: logDelivery,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send topic notification to "${topic}":`,
        error
      );

      // Update template failure stats
      try {
        const template = await NotificationTemplate.findById(templateId);
        if (template) {
          template.stats.totalFailed = (template.stats.totalFailed || 0) + 1;
          template.stats.lastUsed = new Date();
          await template.save();
        }
      } catch (statsError) {
        console.error("Failed to update template failure stats:", statsError);
      }

      // Optional lightweight failure logging for topic notifications
      if (logDelivery) {
        try {
          await TopicNotificationLog.create({
            notificationId,
            campaignId,
            templateId: templateId,
            topic: topic,
            content: {
              title: "Failed to render",
              body: "Notification failed before sending",
              variables: variables,
            },
            delivery: {
              status: "failed",
              failedAt: new Date(),
              failureReason: error.message,
              errorCode: error.code,
            },
            source: source,
            priority: priority,
          });
        } catch (logError) {
          console.warn(
            "Failed to create topic notification failure log:",
            logError.message
          );
        }
      }

      return {
        success: false,
        error: error.message,
        notificationId,
        topic: topic,
        deliveryType: "topic",
        logged: logDelivery,
      };
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(fcmToken, topic) {
    try {
      if (!this.isReady()) {
        throw new Error("Notification service not initialized");
      }

      await this.messaging.subscribeToTopic([fcmToken], topic);

      console.log(`Device subscribed to topic: ${topic}`);
      return { success: true, topic };
    } catch (error) {
      console.error(`Failed to subscribe device to topic ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(fcmToken, topic) {
    try {
      if (!this.isReady()) {
        throw new Error("Notification service not initialized");
      }

      await this.messaging.unsubscribeFromTopic([fcmToken], topic);

      console.log(`Device unsubscribed from topic: ${topic}`);
      return { success: true, topic };
    } catch (error) {
      console.error(`Failed to unsubscribe device from topic ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe device to multiple topics based on user preferences and segments
   */
  async manageTopicSubscriptions(
    fcmToken,
    userPreferences,
    userSegment,
    platform
  ) {
    try {
      const subscriptions = [];
      const errors = [];

      // Get topics based on preferences using centralized logic
      const topicsToSubscribe = getTopicsForPreferences(
        userPreferences,
        userSegment,
        platform
      );

      // Subscribe to each topic
      for (const topic of topicsToSubscribe) {
        try {
          await this.subscribeToTopic(fcmToken, topic);
          subscriptions.push(topic);
        } catch (error) {
          errors.push({ topic, error: error.message });
        }
      }

      return {
        success: true,
        subscriptions,
        errors: errors.length > 0 ? errors : null,
        totalSubscribed: subscriptions.length,
        totalErrors: errors.length,
      };
    } catch (error) {
      console.error("Error managing topic subscriptions:", error);
      return {
        success: false,
        error: error.message,
        subscriptions: [],
        errors: [{ topic: "general", error: error.message }],
      };
    }
  }

  /**
   * Unsubscribe device from topics based on updated preferences
   */
  async unsubscribeFromTopics(fcmToken, topics) {
    try {
      const unsubscriptions = [];
      const errors = [];

      // Validate topics before unsubscribing
      for (const topic of topics) {
        if (!isValidTopic(topic)) {
          errors.push({ topic, error: "Invalid topic" });
          continue;
        }

        try {
          await this.unsubscribeFromTopic(fcmToken, topic);
          unsubscriptions.push(topic);
        } catch (error) {
          errors.push({ topic, error: error.message });
        }
      }

      return {
        success: true,
        unsubscriptions,
        errors: errors.length > 0 ? errors : null,
        totalUnsubscribed: unsubscriptions.length,
        totalErrors: errors.length,
      };
    } catch (error) {
      console.error("Error unsubscribing from topics:", error);
      return {
        success: false,
        error: error.message,
        unsubscriptions: [],
        errors: [{ topic: "general", error: error.message }],
      };
    }
  }

  /**
   * Send a single notification
   */
  async sendNotification(options) {
    const {
      userId,
      templateId,
      variables = {},
      priority = "normal",
      source = "manual",
      campaignId = null,
      scheduledFor = null,
    } = options;

    try {
      // Get user devices
      const devices = await UserDevice.find({
        userId,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
      });

      if (devices.length === 0) {
        console.warn(`No active devices found for user ${userId}`);
        return { success: false, message: "No active devices found" };
      }

      // Get notification template
      const template = await NotificationTemplate.findById(templateId);
      if (!template || template.status !== "active") {
        throw new Error("Template not found or inactive");
      }

      const results = [];

      for (const device of devices) {
        // Check if device can receive notifications
        const canReceive = device.canReceiveNotification();
        if (!canReceive.canReceive) {
          console.warn(
            `Device ${device._id} cannot receive notification:`,
            canReceive.reasons
          );
          continue;
        }

        // Check template preferences
        if (!device.preferences[template.type]) {
          console.warn(`User has disabled ${template.type} notifications`);
          continue;
        }

        const result = await this._sendToDevice(device, template, {
          variables,
          priority,
          source,
          campaignId,
          scheduledFor,
        });

        results.push(result);
      }

      return {
        success: true,
        results,
        totalSent: results.filter((r) => r.success).length,
        totalFailed: results.filter((r) => !r.success).length,
      };
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Send notification to a specific device
   */
  async _sendToDevice(device, template, options) {
    const notificationId = uuidv4();
    const { variables, priority, source, campaignId, scheduledFor } = options;
    let notificationLog = null;

    try {
      // Check if service is ready - this should fail fast without logging
      if (!this.isReady()) {
        console.warn("Notification service not ready, skipping send");

        // Log the failure even when service is not ready
        notificationLog = new NotificationLog({
          notificationId,
          campaignId,
          templateId: template._id,
          templateVersion: template.version,
          userId: device.userId,
          deviceId: device._id,
          fcmToken: device.fcmToken,
          content: {
            title: template.title,
            body: template.body,
          },
          delivery: {
            status: "failed",
            failedAt: new Date(),
            failureReason: "Notification service not initialized",
            errorCode: "SERVICE_NOT_READY",
          },
          context: {
            priority,
            source,
          },
        });

        await notificationLog.save();

        // Update template failure stats
        template.stats.totalFailed = (template.stats.totalFailed || 0) + 1;
        await template.save();

        return {
          success: false,
          error: "Notification service not initialized",
          notificationId,
          deviceId: device._id,
        };
      }

      // Validate template variables
      const validation = template.validateVariables(variables);
      if (!validation.isValid) {
        throw new Error(
          `Missing required variables: ${validation.missingVariables.join(
            ", "
          )}`
        );
      }

      // Render notification content
      const content = template.render(variables);

      // Create notification log entry (this will be updated later)
      notificationLog = new NotificationLog({
        notificationId,
        campaignId,
        templateId: template._id,
        templateVersion: template.version,
        userId: device.userId,
        deviceId: device._id,
        fcmToken: device.fcmToken,
        content: {
          title: content.title,
          body: content.body,
          imageUrl: template.imageUrl,
          iconUrl: template.iconUrl,
          data: {
            templateId: template._id.toString(),
            notificationId,
            campaignId,
            action: content.action || template.action,
          },
        },
        targeting: {
          userSegment: device.userSegment,
          userTags: device.tags,
        },
        personalization: {
          variables,
          personalizedContent: content,
        },
        context: {
          priority,
          source,
        },
        scheduling: {
          scheduledFor,
          timezone: device.deviceInfo.timezone,
        },
      });

      // Prepare FCM message
      const renderedAction = content.action || template.action;
      const fcmMessage = {
        token: device.fcmToken,
        notification: {
          title: content.title,
          body: content.body,
        },
        data: {
          templateId: template._id.toString(),
          notificationId,
          campaignId: campaignId || "",
          actionType: renderedAction?.type || "none",
          actionValue: renderedAction?.value || "",
          buttonText: renderedAction?.buttonText || "",
          templateName: template.name,
          templateType: template.type,
          templateSlug: template.templateId,
        },
        android: {
          priority: priority === "high" ? "high" : "normal",
          notification: {
            imageUrl: template.imageUrl,
            icon: template.iconUrl,
            clickAction: renderedAction?.value,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: "default",
            },
          },
        },
      };

      // Add image for rich notifications
      if (template.imageUrl) {
        fcmMessage.notification.imageUrl = template.imageUrl;
      }

      const startTime = Date.now();

      // Send notification via FCM
      const response = await this.messaging.send(fcmMessage);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Update notification log with success
      notificationLog.delivery.status = "sent";
      notificationLog.delivery.sentAt = new Date();
      notificationLog.delivery.fcmMessageId = response;
      notificationLog.delivery.fcmResponse = { messageId: response };
      notificationLog.performance.processingTime = processingTime;

      await notificationLog.save();

      // Update device counters
      device.incrementNotificationCount();
      device.stats.categoryStats[template.type].received += 1;
      await device.save();

      // Update template stats
      template.stats.totalSent += 1;
      template.stats.lastUsed = new Date();
      await template.save();

      console.log(`Notification sent successfully to device ${device._id}`);

      return {
        success: true,
        notificationId,
        messageId: response,
        processingTime,
      };
    } catch (error) {
      console.error(
        `Failed to send notification to device ${device._id}:`,
        error
      );

      // Update the existing notification log with failure details
      if (notificationLog) {
        notificationLog.delivery.status = "failed";
        notificationLog.delivery.failedAt = new Date();
        notificationLog.delivery.failureReason = error.message;
        notificationLog.delivery.errorCode = error.code;
        await notificationLog.save();
      } else {
        // Create new log if one doesn't exist (shouldn't happen, but safety net)
        notificationLog = new NotificationLog({
          notificationId,
          campaignId,
          templateId: template._id,
          userId: device.userId,
          deviceId: device._id,
          fcmToken: device.fcmToken,
          content: {
            title: template.title,
            body: template.body,
          },
          delivery: {
            status: "failed",
            failedAt: new Date(),
            failureReason: error.message,
            errorCode: error.code,
          },
          context: {
            priority,
            source,
          },
        });
        await notificationLog.save();
      }

      // Update template failure stats
      template.stats.totalFailed = (template.stats.totalFailed || 0) + 1;
      template.stats.lastUsed = new Date();
      await template.save();

      // Handle invalid/expired FCM tokens
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/invalid-argument"
      ) {
        // Use the model method for clean encapsulation
        device.markTokenInvalid(error.message);

        try {
          await device.save();
        } catch (saveError) {
          console.error(
            `Failed to save device ${device._id} as invalid:`,
            saveError
          );
          // Log the save error but don't throw it to prevent notification service from crashing
        }
      } else {
        // For other errors, just mark token as failed (temporary issues)
        device.markTokenFailed(error.message);

        try {
          await device.save();
        } catch (saveError) {
          console.error(
            `Failed to save device ${device._id} as failed:`,
            saveError
          );
          // Log the save error but don't throw it to prevent notification service from crashing
        }
      }

      return {
        success: false,
        error: error.message,
        notificationId,
        deviceId: device._id,
      };
    }
  }

  /**
   * Send bulk notifications (campaign)
   */
  async sendCampaign(campaignId) {
    try {
      const campaign = await NotificationCampaign.findOne({
        campaignId,
      }).populate("template.templateId");

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Check if campaign can be executed
      const canExecute = campaign.canExecute();
      if (!canExecute.canExecute) {
        throw new Error(
          `Campaign cannot be executed: ${canExecute.blockers.join(", ")}`
        );
      }

      // Update campaign status
      campaign.status = "running";
      campaign.execution.startedAt = new Date();
      await campaign.save();

      console.log(`Starting campaign: ${campaign.name} (${campaignId})`);

      // Get target audience
      const targetDevices = await this._getTargetAudience(campaign.targeting);

      campaign.execution.progress.totalTargeted = targetDevices.length;
      campaign.targeting.actualSize = targetDevices.length;
      await campaign.save();

      if (targetDevices.length === 0) {
        campaign.status = "completed";
        campaign.execution.completedAt = new Date();
        await campaign.save();
        return { success: false, message: "No target audience found" };
      }

      // Process in batches
      const batchSize = campaign.delivery.rateLimit.batchSize || 1000;
      const maxPerSecond = campaign.delivery.rateLimit.maxPerSecond || 100;
      const delayBetweenBatches = Math.ceil(batchSize / maxPerSecond) * 1000;

      let processed = 0;
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < targetDevices.length; i += batchSize) {
        const batch = targetDevices.slice(i, i + batchSize);
        const batchId = uuidv4();

        console.log(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            targetDevices.length / batchSize
          )} (${batch.length} devices)`
        );

        // Process batch
        const batchPromises = batch.map((device) =>
          this._sendToDevice(device, campaign.template.templateId, {
            variables: campaign.template.variables,
            priority: campaign.delivery.priority,
            source: "automated",
            campaignId: campaign.campaignId,
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Count results
        batchResults.forEach((result) => {
          processed++;
          if (result.status === "fulfilled" && result.value.success) {
            sent++;
          } else {
            failed++;
          }
        });

        // Update campaign progress
        campaign.execution.progress.processed = processed;
        campaign.execution.progress.sent = sent;
        campaign.execution.progress.failed = failed;
        campaign.execution.progress.currentBatch = batchId;
        campaign.execution.progress.lastProcessedAt = new Date();
        await campaign.save();

        // Rate limiting delay between batches
        if (i + batchSize < targetDevices.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenBatches)
          );
        }
      }

      // Complete campaign
      campaign.status = "completed";
      campaign.execution.completedAt = new Date();

      // Update analytics
      await campaign.updateAnalytics();

      console.log(`Campaign completed: ${sent} sent, ${failed} failed`);

      return {
        success: true,
        campaignId,
        totalProcessed: processed,
        totalSent: sent,
        totalFailed: failed,
      };
    } catch (error) {
      console.error(`Campaign execution failed:`, error);

      // Mark campaign as failed
      const campaign = await NotificationCampaign.findOne({ campaignId });
      if (campaign) {
        campaign.status = "failed";
        campaign.execution.errors.push({
          timestamp: new Date(),
          errorType: "execution_error",
          errorMessage: error.message,
        });
        await campaign.save();
      }

      throw error;
    }
  }

  /**
   * Get target audience based on campaign targeting criteria
   */
  async _getTargetAudience(targeting) {
    const query = { "tokenStatus.isActive": true, "preferences.enabled": true };

    // User segments
    if (targeting.segments && targeting.segments.length > 0) {
      const segmentQueries = [];

      targeting.segments.forEach((segment) => {
        switch (segment) {
          case "new_users":
            segmentQueries.push({ "behavior.totalAppOpens": { $lte: 5 } });
            break;
          case "active_users":
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            segmentQueries.push({
              "behavior.lastAppOpen": { $gte: sevenDaysAgo },
            });
            break;
          case "inactive_users":
            const thirtyDaysAgo = new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            );
            segmentQueries.push({
              "behavior.lastAppOpen": { $lt: thirtyDaysAgo },
            });
            break;
          case "cart_abandoners":
            segmentQueries.push({
              "behavior.cartAbandonmentCount": { $gt: 0 },
            });
            break;
          case "premium_customers":
            segmentQueries.push({ "behavior.totalSpent": { $gte: 100000 } });
            break;
        }
      });

      if (segmentQueries.length > 0) {
        query.$or = segmentQueries;
      }
    }

    // User tags
    if (targeting.tags) {
      if (targeting.tags.include && targeting.tags.include.length > 0) {
        query.tags = { $in: targeting.tags.include };
      }
      if (targeting.tags.exclude && targeting.tags.exclude.length > 0) {
        query.tags = { ...query.tags, $nin: targeting.tags.exclude };
      }
    }

    // Behavioral filters
    if (targeting.behavior) {
      if (targeting.behavior.lastAppOpen) {
        const minDate = targeting.behavior.lastAppOpen.min
          ? new Date(
              Date.now() -
                targeting.behavior.lastAppOpen.min * 24 * 60 * 60 * 1000
            )
          : null;
        const maxDate = targeting.behavior.lastAppOpen.max
          ? new Date(
              Date.now() -
                targeting.behavior.lastAppOpen.max * 24 * 60 * 60 * 1000
            )
          : null;

        if (minDate && maxDate) {
          query["behavior.lastAppOpen"] = { $gte: maxDate, $lte: minDate };
        } else if (minDate) {
          query["behavior.lastAppOpen"] = { $lte: minDate };
        } else if (maxDate) {
          query["behavior.lastAppOpen"] = { $gte: maxDate };
        }
      }

      if (targeting.behavior.totalPurchases) {
        query["behavior.totalPurchases"] = {};
        if (targeting.behavior.totalPurchases.min !== undefined) {
          query["behavior.totalPurchases"].$gte =
            targeting.behavior.totalPurchases.min;
        }
        if (targeting.behavior.totalPurchases.max !== undefined) {
          query["behavior.totalPurchases"].$lte =
            targeting.behavior.totalPurchases.max;
        }
      }

      if (
        targeting.behavior.favoriteCategories &&
        targeting.behavior.favoriteCategories.length > 0
      ) {
        query["behavior.favoriteCategories"] = {
          $in: targeting.behavior.favoriteCategories,
        };
      }
    }

    // Device filters
    if (targeting.device) {
      if (targeting.device.platforms && targeting.device.platforms.length > 0) {
        query["deviceInfo.platform"] = { $in: targeting.device.platforms };
      }
      if (targeting.device.languages && targeting.device.languages.length > 0) {
        query["deviceInfo.locale"] = { $in: targeting.device.languages };
      }
    }

    // Location filters
    if (targeting.location) {
      if (
        targeting.location.countries &&
        targeting.location.countries.length > 0
      ) {
        query["location.country"] = { $in: targeting.location.countries };
      }
      if (targeting.location.states && targeting.location.states.length > 0) {
        query["location.state"] = { $in: targeting.location.states };
      }
    }

    console.log("Target audience query:", JSON.stringify(query, null, 2));

    return await UserDevice.find(query);
  }

  /**
   * Track notification interaction (open/click)
   */
  async trackInteraction(notificationId, interactionType, metadata = {}) {
    try {
      const log = await NotificationLog.findOne({ notificationId }).populate(
        "templateId",
        "type name"
      );

      if (!log) {
        console.warn(`Notification log not found for ID: ${notificationId}`);
        return { success: false, message: "Notification not found" };
      }

      switch (interactionType) {
        case "opened":
          log.markAsOpened();
          break;
        case "clicked":
          log.markAsClicked();
          break;
        case "dismissed":
          log.markAsDismissed();
          break;
        case "converted":
          log.markAsConverted(
            metadata.conversionValue,
            metadata.conversionEvents
          );
          break;
      }

      await log.save();

      // Update device stats (with safety checks)
      const device = await UserDevice.findById(log.deviceId);
      if (device) {
        // Get template type safely
        const templateType = log.templateId?.type || "unknown";

        if (interactionType === "opened") {
          device.stats.totalOpened += 1;
          // Initialize category stats if not exists
          if (!device.stats.categoryStats[templateType]) {
            device.stats.categoryStats[templateType] = {
              received: 0,
              opened: 0,
              clicked: 0,
            };
          }
          device.stats.categoryStats[templateType].opened += 1;
        } else if (interactionType === "clicked") {
          device.stats.totalClicked += 1;
          // Initialize category stats if not exists
          if (!device.stats.categoryStats[templateType]) {
            device.stats.categoryStats[templateType] = {
              received: 0,
              opened: 0,
              clicked: 0,
            };
          }
          device.stats.categoryStats[templateType].clicked += 1;
        }

        device.stats.lastInteraction = new Date();
        await device.save();
      }

      // Update template stats
      const template = await NotificationTemplate.findById(log.templateId);
      if (template) {
        if (interactionType === "opened") {
          template.stats.totalOpened += 1;
        } else if (interactionType === "clicked") {
          template.stats.totalClicked += 1;
        }
        await template.save();
      }

      console.log(
        `Tracked ${interactionType} for notification ${notificationId}`
      );

      return { success: true, message: "Interaction tracked successfully" };
    } catch (error) {
      console.error("Error tracking interaction:", error);
      throw error;
    }
  }

  /**
   * Get notification analytics
   */
  async getAnalytics(filter = {}) {
    try {
      const { startDate, endDate, templateId, campaignId, userId, type } =
        filter;

      const matchQuery = {};

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      if (templateId) matchQuery.templateId = templateId;
      if (campaignId) matchQuery.campaignId = campaignId;
      if (userId) matchQuery.userId = userId;

      const analytics = await NotificationLog.getDeliveryStats(matchQuery);

      return {
        success: true,
        data: analytics[0] || {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalConverted: 0,
        },
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      throw error;
    }
  }

  /**
   * Clean up invalid devices that have failed FCM tokens
   * This method can be called periodically to maintain clean device registry
   */
  async cleanupInvalidDevices() {
    try {
      console.log("🧹 Starting cleanup of invalid devices...");

      // Find devices with consecutive failures or invalid tokens
      const invalidDevices = await UserDevice.find({
        $or: [
          { "tokenStatus.failureCount": { $gte: 3 } },
          { "tokenStatus.isActive": false },
          { fcmToken: null },
          { isActive: false },
        ],
      });

      if (invalidDevices.length === 0) {
        console.log("No invalid devices found");
        return { success: true, cleaned: 0 };
      }

      let cleanedCount = 0;
      for (const device of invalidDevices) {
        if (device.isActive) {
          // Use the model method for consistent deregistration
          device.markTokenInvalid(
            device.tokenStatus.failureReason ||
              "Cleaned up due to invalid token status"
          );

          await device.save();
          cleanedCount++;

          console.log(
            `🗑️ Deactivated invalid device: ${device._id} (User: ${device.userId})`
          );
        }
      }

      console.log(`Cleanup completed: ${cleanedCount} devices deactivated`);

      return {
        success: true,
        cleaned: cleanedCount,
        totalInvalid: invalidDevices.length,
      };
    } catch (error) {
      console.error("Error during device cleanup:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get devices that need cleanup (for monitoring/admin purposes)
   */
  async getDevicesNeedingCleanup() {
    try {
      const devicesNeedingCleanup = await UserDevice.find({
        $or: [
          { "tokenStatus.failureCount": { $gte: 2 } }, // Devices close to being deactivated
          { "tokenStatus.isActive": false, isActive: true }, // Inconsistent state
          { isActive: true }, // Active devices without tokens
        ],
      }).select(
        "userId deviceInfo.platform tokenStatus isActive fcmToken createdAt"
      );

      return {
        success: true,
        devices: devicesNeedingCleanup,
        count: devicesNeedingCleanup.length,
      };
    } catch (error) {
      console.error("Error getting devices needing cleanup:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new NotificationService();
