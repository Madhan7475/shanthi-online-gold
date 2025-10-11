// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const NotificationService = require("../services/NotificationService");
const NotificationTemplate = require("../models/NotificationTemplate");
const NotificationCampaign = require("../models/NotificationCampaign");
const UserDevice = require("../models/UserDevice");
const NotificationLog = require("../models/NotificationLog");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");
const adminAuth = require("../middleware/adminAuth");

// Initialize notification service (safe initialization)
(async () => {
  try {
    await NotificationService.initialize();
  } catch (error) {
    console.warn(
      "Notification service initialization failed in routes:",
      error.message
    );
  }
})();

// Helper function to safely call notification service methods
const safeNotificationCall = async (serviceFn, fallbackResponse = null) => {
  try {
    if (!NotificationService || typeof serviceFn !== "function") {
      return (
        fallbackResponse || {
          success: false,
          error: "Notification service not available",
        }
      );
    }
    return await serviceFn();
  } catch (error) {
    console.error("Notification service error:", error.message);
    return fallbackResponse || { success: false, error: error.message };
  }
};

// ========================================
// HEALTH CHECK & STATUS ROUTES
// ========================================

/**
 * @route   GET /api/notifications/health
 * @desc    Check notification service health
 * @access  Public
 */
router.get("/health", async (req, res) => {
  try {
    const {
      getNotificationServicesStatus,
    } = require("../services/notificationInit");
    const detailedStatus = await getNotificationServicesStatus();

    // Create simplified health check response
    const status = {
      service: "notification",
      timestamp: detailedStatus.timestamp,
      status: "healthy",
      initialized: false,
      connection: { success: false, message: "Service not initialized" },
    };

    // Determine overall health based on base service
    if (detailedStatus.services.base) {
      status.initialized = detailedStatus.services.base.initialized;
      status.status = detailedStatus.services.base.ready
        ? "healthy"
        : "unhealthy";

      if (detailedStatus.services.base.connection) {
        status.connection = detailedStatus.services.base.connection;
      }
    }

    // Get some basic stats
    try {
      const deviceCount = await UserDevice.countDocuments({ isActive: true });
      const templateCount = await NotificationTemplate.countDocuments({
        status: "active",
      });

      status.stats = {
        activeDevices: deviceCount,
        activeTemplates: templateCount,
        automatedService:
          detailedStatus.services.automated?.initialized || false,
        scheduledJobs: detailedStatus.services.automated?.scheduledJobs || 0,
      };
    } catch (error) {
      status.stats = { error: "Could not fetch stats" };
    }

    const httpStatus = status.status === "healthy" ? 200 : 503;
    res.status(httpStatus).json(status);
  } catch (error) {
    res.status(500).json({
      service: "notification",
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ========================================
// USER DEVICE MANAGEMENT ROUTES
// ========================================

/**
 * @route   POST /api/notifications/devices/register
 * @desc    Register user device for push notifications
 * @access  Private
 */
router.post("/devices/register", verifyAuthFlexible, async (req, res) => {
  try {
    const {
      fcmToken,
      platform,
      deviceId,
      appVersion,
      osVersion,
      deviceModel,
      manufacturer,
      locale,
      timezone,
    } = req.body;

    if (!fcmToken || !platform) {
      return res.status(400).json({
        success: false,
        message: "FCM token and platform are required",
      });
    }

    // Get user ID from auth
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    } else {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const result = await safeNotificationCall(() =>
      NotificationService.registerDevice({
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
      })
    );

    res.json(result);
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register device",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/devices
 * @desc    Get user's registered devices
 * @access  Private
 */
router.get("/devices", verifyAuthFlexible, async (req, res) => {
  try {
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    const devices = await UserDevice.find({ userId })
      .select("-fcmToken") // Don't expose FCM tokens
      .sort({ createdAt: -1 });

    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch devices",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences for all user devices
 * @access  Private
 */
router.get("/preferences", verifyAuthFlexible, async (req, res) => {
  try {
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    const devices = await UserDevice.find({ userId, isActive: true })
      .select(
        "preferences deviceInfo.platform deviceInfo.deviceId deviceInfo.deviceModel registeredAt lastActiveAt"
      )
      .sort({ lastActiveAt: -1 });

    if (devices.length === 0) {
      return res.json({
        success: true,
        message: "No active devices found",
        devices: [],
      });
    }

    // Format response for easier frontend consumption
    const formattedDevices = devices.map((device) => ({
      deviceId: device._id,
      platform: device.deviceInfo.platform,
      deviceName: device.deviceInfo.deviceId,
      deviceModel: device.deviceInfo.deviceModel,
      registeredAt: device.registeredAt,
      lastActiveAt: device.lastActiveAt,
      preferences: device.preferences,
    }));

    res.json({
      success: true,
      totalDevices: devices.length,
      devices: formattedDevices,
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user preferences",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/devices/:deviceId
 * @desc    Deregister device (logout)
 * @access  Private
 */
router.delete("/devices/:deviceId", verifyAuthFlexible, async (req, res) => {
  try {
    const { type = "soft" } = req.query; // soft or hard deletion

    const result = await NotificationService.deregisterDevice(
      req.params.deviceId,
      { type }
    );

    if (!result.success) {
      res.status(404).json(result);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error("Error deregistering device:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deregister device",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/devices/:deviceId/token
 * @desc    Update FCM token for existing device
 * @access  Private
 */
router.put("/devices/:deviceId/token", verifyAuthFlexible, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const result = await NotificationService.updateFCMToken(
      req.params.deviceId,
      fcmToken
    );

    if (result.success) {
      res.status(404).json(result);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update FCM token",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/devices/:deviceId/preferences
 * @desc    Get notification preferences for a specific device
 * @access  Private
 */
router.get(
  "/devices/:deviceId/preferences",
  verifyAuthFlexible,
  async (req, res) => {
    try {
      let userId;
      if (req.auth?.type === "firebase") {
        userId = req.user.uid;
      } else if (req.auth?.type === "jwt") {
        userId = req.user.firebaseUid || req.user.userId;
      }

      const device = await UserDevice.findOne({
        _id: req.params.deviceId,
        userId,
      }).select("preferences deviceInfo.platform deviceInfo.deviceId");

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      res.json({
        success: true,
        deviceId: device._id,
        platform: device.deviceInfo.platform,
        deviceName: device.deviceInfo.deviceId,
        preferences: device.preferences,
      });
    } catch (error) {
      console.error("Error fetching device preferences:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch device preferences",
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/notifications/devices/:deviceId/preferences
 * @desc    Update notification preferences for a device
 * @access  Private
 */
router.put(
  "/devices/:deviceId/preferences",
  verifyAuthFlexible,
  async (req, res) => {
    try {
      let userId;
      if (req.auth?.type === "firebase") {
        userId = req.user.uid;
      } else if (req.auth?.type === "jwt") {
        userId = req.user.firebaseUid || req.user.userId;
      }

      const device = await UserDevice.findOne({
        _id: req.params.deviceId,
        userId,
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Update preferences
      const allowedPreferences = [
        "enabled",
        "promotional",
        "userSpecific",
        "transactional",
        "engagement",
        "seasonal",
        "quietHours",
        "maxPerDay",
        "maxPerHour",
      ];

      Object.keys(req.body).forEach((key) => {
        if (allowedPreferences.includes(key)) {
          if (key === "quietHours" && typeof req.body[key] === "object") {
            device.preferences.quietHours = {
              ...device.preferences.quietHours,
              ...req.body[key],
            };
          } else {
            device.preferences[key] = req.body[key];
          }
        }
      });

      await device.save();

      res.json(device.preferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update preferences",
        error: error.message,
      });
    }
  }
);

// ========================================
// NOTIFICATION TRACKING ROUTES
// ========================================

/**
 * @route   POST /api/notifications/track/:notificationId/:action
 * @desc    Track notification interactions (open, click, dismiss, convert)
 * @access  Public (no auth required for tracking)
 */
router.post("/track/:notificationId/:action", async (req, res) => {
  try {
    const { notificationId, action } = req.params;
    const metadata = req.body || {};

    const validActions = ["opened", "clicked", "dismissed", "converted"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Must be one of: opened, clicked, dismissed, converted",
      });
    }

    const result = await NotificationService.trackInteraction(
      notificationId,
      action,
      metadata
    );
    res.json(result);
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track interaction",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/history
 * @desc    Get user's notification history (deduplicated across devices)
 * @access  Private
 */
router.get("/history", verifyAuthFlexible, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, grouped = 'true' } = req.query;

    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    // Support both grouped (default) and ungrouped views
    const shouldGroup = grouped !== 'false';

    if (!shouldGroup) {
      // Legacy behavior - return all notifications (can show duplicates)
      return await getLegacyNotificationHistory(req, res, userId);
    }

    // New grouped behavior - deduplicate across devices
    const matchQuery = { userId };

    if (status) {
      matchQuery["delivery.status"] = status;
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Use aggregation to group notifications by template + time window
    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      
      // Group by template + content + hour to merge same notifications sent to multiple devices
      {
        $group: {
          _id: {
            templateId: "$templateId",
            title: "$content.title",
            body: "$content.body",
            // Group by hour to handle notifications sent within same hour as duplicates
            hour: {
              $dateToString: {
                format: "%Y-%m-%d-%H",
                date: "$createdAt"
              }
            }
          },
          
          // Keep the most recent notification data
          latestNotification: { $first: "$$ROOT" },
          
          // Aggregate interaction data across devices
          totalDevices: { $sum: 1 },
          isReadOnAnyDevice: { $max: "$interaction.opened" },
          isClickedOnAnyDevice: { $max: "$interaction.clicked" },
          isDismissedOnAnyDevice: { $max: "$interaction.dismissed" },
          
          // Keep earliest and latest timestamps
          firstSentAt: { $min: "$delivery.sentAt" },
          lastSentAt: { $max: "$delivery.sentAt" },
          firstReadAt: { $min: "$interaction.openedAt" },
          lastReadAt: { $max: "$interaction.openedAt" },
          firstClickedAt: { $min: "$interaction.clickedAt" },
          
          // Keep all notification IDs for tracking
          notificationIds: { $push: "$notificationId" },
          
          // Delivery status aggregation
          deliveryStatuses: { $push: "$delivery.status" },
          successfulDeliveries: {
            $sum: {
              $cond: [
                { $in: ["$delivery.status", ["sent", "delivered"]] },
                1,
                0
              ]
            }
          }
        }
      },
      
      // Sort by latest notification time
      { $sort: { "latestNotification.createdAt": -1 } },
      
      // Add pagination
      { $skip: skip },
      { $limit: Number(limit) },
      
      // Populate template information
      {
        $lookup: {
          from: "notificationtemplates",
          localField: "_id.templateId",
          foreignField: "_id",
          as: "template",
          pipeline: [{ $project: { name: 1, type: 1, templateId: 1 } }]
        }
      }
    ];

    const [groupedNotifications, totalCountResult] = await Promise.all([
      NotificationLog.aggregate(pipeline),
      NotificationLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              templateId: "$templateId",
              title: "$content.title",
              body: "$content.body",
              hour: {
                $dateToString: {
                  format: "%Y-%m-%d-%H",
                  date: "$createdAt"
                }
              }
            }
          }
        },
        { $count: "total" }
      ])
    ]);

    const totalCount = totalCountResult[0]?.total || 0;

    // Transform data for frontend consumption
    const items = groupedNotifications.map((group) => {
      const notification = group.latestNotification;
      const template = group.template[0] || {};
      
      return {
        // Use the first notification ID as the primary ID
        id: group.notificationIds[0],
        
        // For multi-device scenarios, provide additional context
        groupId: `${group._id.templateId}_${group._id.hour}`,
        allNotificationIds: group.notificationIds,
        
        // Notification content
        title: notification.content.title,
        body: notification.content.body,
        imageUrl: notification.content.imageUrl,
        data: notification.content.data,

        // Template information
        template: {
          name: template.name,
          type: template.type,
          id: template.templateId,
        },

        // Aggregated status information
        status: group.successfulDeliveries > 0 ? "delivered" : "failed",
        sentAt: group.firstSentAt,
        deliveredAt: group.lastSentAt,

        // Aggregated interaction status (true if read/clicked on ANY device)
        isRead: group.isReadOnAnyDevice || false,
        readAt: group.firstReadAt,
        isClicked: group.isClickedOnAnyDevice || false,
        clickedAt: group.firstClickedAt,
        isDismissed: group.isDismissedOnAnyDevice || false,

        // Multi-device context
        deviceInfo: {
          totalDevices: group.totalDevices,
          deliveryStatuses: group.deliveryStatuses,
          successfulDeliveries: group.successfulDeliveries
        },

        // Context
        priority: notification.context?.priority,
        source: notification.context?.source,

        // Timestamps
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      items,
      page: Number(page),
      pages: totalPages,
      total: totalCount,
      grouped: true,
      info: {
        message: "Notifications are grouped across devices to avoid duplicates",
        note: "Add ?grouped=false to see all individual notification deliveries"
      }
    });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification history",
      error: error.message,
    });
  }
});

// Helper function for legacy ungrouped behavior
async function getLegacyNotificationHistory(req, res, userId) {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  
  const query = { userId };

  if (status) {
    query["delivery.status"] = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, totalCount] = await Promise.all([
    NotificationLog.find(query)
      .populate("templateId", "name type templateId")
      .select({
        // Essential identification
        notificationId: 1,

        // Content (what user sees)
        "content.title": 1,
        "content.body": 1,
        "content.imageUrl": 1,
        "content.data": 1,

        // Status and interaction (what frontend needs)
        "delivery.status": 1,
        "delivery.sentAt": 1,
        "delivery.deliveredAt": 1,

        // Read status and interactions
        "interaction.opened": 1,
        "interaction.openedAt": 1,
        "interaction.clicked": 1,
        "interaction.clickedAt": 1,
        "interaction.dismissed": 1,
        "interaction.dismissedAt": 1,

        // Context for frontend logic
        "context.priority": 1,
        "context.source": 1,
        
        // Device info for debugging
        deviceId: 1,

        // Timestamps
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    NotificationLog.countDocuments(query),
  ]);

  // Transform data for frontend consumption
  const items = notifications.map((notification) => ({
    id: notification.notificationId,

    // Notification content
    title: notification.content.title,
    body: notification.content.body,
    imageUrl: notification.content.imageUrl,
    data: notification.content.data,

    // Template information
    template: {
      name: notification.templateId?.name,
      type: notification.templateId?.type,
      id: notification.templateId?.templateId,
    },

    // Status information
    status: notification.delivery.status,
    sentAt: notification.delivery.sentAt,
    deliveredAt: notification.delivery.deliveredAt,

    // Read/interaction status
    isRead: notification.interaction.opened || false,
    readAt: notification.interaction.openedAt,
    isClicked: notification.interaction.clicked || false,
    clickedAt: notification.interaction.clickedAt,
    isDismissed: notification.interaction.dismissed || false,
    dismissedAt: notification.interaction.dismissedAt,

    // Context
    priority: notification.context.priority,
    source: notification.context.source,
    
    // Device context (for debugging)
    deviceId: notification.deviceId,

    // Timestamps
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  }));

  const totalPages = Math.ceil(totalCount / Number(limit));

  res.json({
    items,
    page: Number(page),
    pages: totalPages,
    total: totalCount,
    grouped: false,
    info: {
      message: "Showing all individual notification deliveries",
      note: "This may show duplicates for users with multiple devices"
    }
  });
}

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read (handles grouped notifications)
 * @access  Private
 */
router.put("/:notificationId/read", verifyAuthFlexible, async (req, res) => {
  try {
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    const { notificationId } = req.params;
    const { markAllDevices = false } = req.body;

    const notification = await NotificationLog.findOne({
      notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    let markedCount = 0;

    if (markAllDevices) {
      // Mark as read on ALL devices for this user and notification group
      // Find all notifications with same template + content + time window
      const hourString = notification.createdAt.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      
      const updateResult = await NotificationLog.updateMany({
        userId,
        templateId: notification.templateId,
        "content.title": notification.content.title,
        "content.body": notification.content.body,
        createdAt: {
          $gte: new Date(hourString + ":00:00.000Z"),
          $lt: new Date(hourString + ":59:59.999Z")
        },
        "interaction.opened": false
      }, {
        "interaction.opened": true,
        "interaction.openedAt": new Date()
      });

      markedCount = updateResult.modifiedCount;
    } else {
      // Mark as opened only on the specific device
      if (!notification.interaction.opened) {
        notification.markAsOpened();
        await notification.save();
        markedCount = 1;
      }
    }

    res.json({
      success: true,
      message: markAllDevices 
        ? `Notification marked as read on ${markedCount} devices`
        : "Notification marked as read",
      isRead: true,
      readAt: notification.interaction.openedAt,
      markedDevices: markedCount,
      groupedRead: markAllDevices
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.put("/mark-all-read", verifyAuthFlexible, async (req, res) => {
  try {
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    const result = await NotificationLog.updateMany(
      {
        userId,
        "interaction.opened": false,
      },
      {
        "interaction.opened": true,
        "interaction.openedAt": new Date(),
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications (grouped across devices)
 * @access  Private
 */
router.get("/unread-count", verifyAuthFlexible, async (req, res) => {
  try {
    let userId;
    if (req.auth?.type === "firebase") {
      userId = req.user.uid;
    } else if (req.auth?.type === "jwt") {
      userId = req.user.firebaseUid || req.user.userId;
    }

    // Count unique notifications that are unread on ALL devices
    // A notification is considered "read" if it's been opened on ANY device
    const unreadGroups = await NotificationLog.aggregate([
      {
        $match: {
          userId,
          "delivery.status": { $in: ["sent", "delivered"] }
        }
      },
      {
        $group: {
          _id: {
            templateId: "$templateId",
            title: "$content.title",
            body: "$content.body",
            hour: {
              $dateToString: {
                format: "%Y-%m-%d-%H",
                date: "$createdAt"
              }
            }
          },
          hasBeenRead: { $max: "$interaction.opened" }
        }
      },
      {
        $match: {
          hasBeenRead: false
        }
      },
      {
        $count: "unreadCount"
      }
    ]);

    const unreadCount = unreadGroups[0]?.unreadCount || 0;

    res.json({
      success: true,
      unreadCount,
      grouped: true
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
});

// ========================================
// ADMIN ROUTES - TEMPLATES
// ========================================

/**
 * @route   GET /api/notifications/admin/templates
 * @desc    Get all notification templates
 * @access  Admin
 */
router.get("/admin/templates", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [templates, totalCount] = await Promise.all([
      NotificationTemplate.find(query)
        .populate("createdBy", "name email")
        .populate("lastModifiedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NotificationTemplate.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      items: templates,
      page: Number(page),
      pages: totalPages,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/admin/templates
 * @desc    Create new notification template
 * @access  Admin
 */
router.post("/admin/templates", adminAuth, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user._id,
      templateId:
        req.body.templateId ||
        `TPL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const template = new NotificationTemplate(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/admin/templates/:id
 * @desc    Update notification template
 * @access  Admin
 */
router.put("/admin/templates/:id", adminAuth, async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Update template
    Object.keys(req.body).forEach((key) => {
      if (key !== "_id" && key !== "createdBy" && key !== "createdAt") {
        template[key] = req.body[key];
      }
    });

    template.lastModifiedBy = req.user._id;
    template.version += 1;

    await template.save();

    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message,
    });
  }
});

// ========================================
// ADMIN ROUTES - CAMPAIGNS
// ========================================

/**
 * @route   POST /api/notifications/admin/campaigns
 * @desc    Create and optionally start a notification campaign
 * @access  Admin
 */
router.post("/admin/campaigns", adminAuth, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      createdBy: req.user._id,
      campaignId:
        req.body.campaignId ||
        `CAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const campaign = new NotificationCampaign(campaignData);
    await campaign.save();

    // If immediate execution is requested and campaign is approved
    if (req.body.executeImmediately && campaign.compliance.approved) {
      try {
        const result = await NotificationService.sendCampaign(
          campaign.campaignId
        );
        res.status(201).json({
          success: true,
          message: "Campaign created and executed successfully",
          data: { campaign, execution: result },
        });
      } catch (executionError) {
        res.status(201).json({
          success: true,
          message: "Campaign created but execution failed",
          data: campaign,
          executionError: executionError.message,
        });
      }
    } else {
      res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        data: campaign,
      });
    }
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/admin/campaigns/:id/execute
 * @desc    Execute a notification campaign
 * @access  Admin
 */
router.post("/admin/campaigns/:id/execute", adminAuth, async (req, res) => {
  try {
    const campaign = await NotificationCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const result = await NotificationService.sendCampaign(campaign.campaignId);

    res.json(result);
  } catch (error) {
    console.error("Error executing campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute campaign",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/admin/campaigns
 * @desc    Get all notification campaigns
 * @access  Admin
 */
router.get("/admin/campaigns", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [campaigns, totalCount] = await Promise.all([
      NotificationCampaign.find(query)
        .populate("template.templateId", "name type")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NotificationCampaign.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      items: campaigns,
      page: Number(page),
      pages: totalPages,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
});

// ========================================
// MANUAL SEND ROUTES
// ========================================

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification to specific user(s)
 * @access  Admin
 */
router.post("/send", adminAuth, async (req, res) => {
  try {
    const {
      userId,
      userIds,
      templateId,
      variables = {},
      priority = "normal",
    } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const targetUsers = userId ? [userId] : userIds || [];
    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one user ID is required",
      });
    }

    const results = [];
    for (const targetUserId of targetUsers) {
      try {
        const result = await NotificationService.sendNotification({
          userId: targetUserId,
          templateId,
          variables,
          priority,
          source: "manual",
        });
        results.push({ userId: targetUserId, ...result });
      } catch (error) {
        results.push({
          userId: targetUserId,
          success: false,
          error: error.message,
        });
      }
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    res.json({
      results,
      totalSent,
      totalFailed,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: error.message,
    });
  }
});

// ========================================
// ANALYTICS ROUTES
// ========================================

/**
 * @route   GET /api/notifications/analytics
 * @desc    Get notification analytics
 * @access  Admin
 */
router.get("/analytics", adminAuth, async (req, res) => {
  try {
    const result = await NotificationService.getAnalytics(req.query);
    res.json(result);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
});

// ========================================
// SERVICE MANAGEMENT ROUTES (ADMIN)
// ========================================

/**
 * @route   GET /api/notifications/admin/services/status
 * @desc    Get detailed status of all notification services
 * @access  Admin
 */
router.get("/admin/services/status", adminAuth, async (req, res) => {
  try {
    const {
      getNotificationServicesStatus,
    } = require("../services/notificationInit");
    const status = await getNotificationServicesStatus();
    res.json(status);
  } catch (error) {
    console.error("Error getting notification services status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get services status",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/admin/services/restart
 * @desc    Restart notification services
 * @access  Admin
 */
router.post("/admin/services/restart", adminAuth, async (req, res) => {
  try {
    const {
      restartNotificationServices,
    } = require("../services/notificationInit");
    const result = await restartNotificationServices();

    if (result.success) {
      res.json({
        success: true,
        message: "Notification services restarted successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to restart notification services",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error restarting notification services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restart notification services",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/admin/cleanup-duplicates
 * @desc    Clean up duplicate device registrations
 * @access  Admin
 */
router.post("/admin/cleanup-duplicates", adminAuth, async (req, res) => {
  try {
    console.log("Starting duplicate device cleanup...");

    // Find all duplicate combinations of userId + deviceId
    const duplicates = await UserDevice.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            deviceId: "$deviceInfo.deviceId",
          },
          documents: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    let totalCleaned = 0;

    for (const duplicate of duplicates) {
      const docs = duplicate.documents;
      // Keep the most recent one (by updatedAt or createdAt)
      docs.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
      const keepDoc = docs[0];
      const deleteIds = docs.slice(1).map((doc) => doc._id);

      // Delete all but the most recent
      const result = await UserDevice.deleteMany({ _id: { $in: deleteIds } });
      totalCleaned += result.deletedCount;

      console.log(
        `Cleaned ${result.deletedCount} duplicates for user ${duplicate._id.userId}, device ${duplicate._id.deviceId}`
      );
    }

    res.json({
      success: true,
      message: "Duplicate cleanup completed",
      duplicateGroups: duplicates.length,
      totalCleaned: totalCleaned,
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean up duplicates",
      error: error.message,
    });
  }
});

module.exports = router;
