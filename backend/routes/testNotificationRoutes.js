// backend/routes/testNotificationRoutes.js
const express = require("express");
const router = express.Router();
const NotificationService = require("../services/NotificationService");
const AutomatedNotificationService = require("../services/AutomatedNotificationService");
const NotificationTemplate = require("../models/NotificationTemplate");
const UserDevice = require("../models/UserDevice");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");

// Services are initialized in server.js via notificationInit.js
// No need to initialize again here to avoid duplicate cron jobs

// ========================================
// COMPREHENSIVE TESTING ROUTES
// ========================================

/**
 * @route   GET /api/test-notifications/
 * @desc    Get overview of testing capabilities
 * @access  Admin
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const templates = await NotificationTemplate.find({ status: "active" })
      .select("templateId name type description")
      .sort({ type: 1, name: 1 });

    const activeDevices = await UserDevice.countDocuments({
      isActive: true,
      "tokenStatus.isActive": true,
    });

    const testingCapabilities = {
      overview: {
        totalTemplates: templates.length,
        activeDevices: activeDevices,
        serviceStatus: {
          notificationService: NotificationService.isReady(),
          automatedService: AutomatedNotificationService.isInitialized,
        },
      },
      endpoints: {
        singleNotification: "POST /api/test-notifications/send/:type",
        allNotifications: "POST /api/test-notifications/send-all",
        deviceSetup: "POST /api/test-notifications/setup-device",
        goldPriceTest: "POST /api/test-notifications/gold-price",
        ecommerceFlow: "POST /api/test-notifications/ecommerce-flow",
        bulkTest: "POST /api/test-notifications/bulk-test",
      },
      availableTypes: templates.reduce((acc, template) => {
        const type = template.type || "other";
        if (!acc[type]) acc[type] = [];
        acc[type].push({
          templateId: template.templateId,
          name: template.name,
          description: template.description,
          testEndpoint: `/api/test-notifications/send/${template.templateId.toLowerCase()}`,
        });
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      message: "Shanthi Online Gold - Notification Testing Suite",
      ...testingCapabilities,
      quickStart: {
        setupDevice: "POST /api/test-notifications/setup-device",
        testGoldPrice:
          "POST /api/test-notifications/send/daily_gold_price?userId=YOUR_USER_ID",
        testAll: "POST /api/test-notifications/send-all?userId=YOUR_USER_ID",
      },
    });
  } catch (error) {
    console.error("Error in test notifications overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load testing overview",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/test-notifications/setup-device
 * @desc    Set up a test device for notification testing
 * @access  Admin
 */
router.post("/setup-device", adminAuth, async (req, res) => {
  try {
    const {
      userId = `test-user-${Date.now()}`,
      fcmToken = `test-token-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      platform = "android",
      deviceName = "Test Device",
      enableAllNotifications = true,
    } = req.body;

    console.log(`🧪 Setting up test device for user: ${userId}`);

    // Create test device registration
    const testDevice = {
      userId,
      fcmToken,
      platform,
      deviceId: `test-device-${Date.now()}`,
      appVersion: "1.0.0-test",
      osVersion: platform === "ios" ? "17.0" : "14.0",
      deviceModel: deviceName,
      manufacturer: platform === "ios" ? "Apple" : "Google",
      locale: "en-IN",
      timezone: "Asia/Kolkata",
    };

    const result = await NotificationService.registerDevice(testDevice);

    if (result.success && enableAllNotifications) {
      // Enable all notification preferences for comprehensive testing
      const device = await UserDevice.findById(result.deviceId);
      if (device) {
        device.preferences = {
          enabled: true,
          promotional: true,
          userSpecific: true,
          transactional: true,
          engagement: true,
          seasonal: true,
          quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00",
          },
          maxPerDay: 100,
          maxPerHour: 20,
        };
        await device.save();
        console.log(
          `All notification preferences enabled for device: ${result.deviceId}`
        );
      }
    }

    res.json({
      success: result.success,
      message: result.success
        ? "Test device created successfully with all notifications enabled"
        : "Failed to create test device",
      testDevice: {
        userId,
        deviceId: result.deviceId,
        fcmToken: fcmToken.substr(0, 20) + "...",
        platform,
        deviceName,
        preferencesEnabled: enableAllNotifications,
      },
      nextSteps: [
        `Use userId "${userId}" in subsequent test requests`,
        "Test individual notifications with POST /api/test-notifications/send/:type",
        "Run comprehensive tests with POST /api/test-notifications/send-all",
      ],
    });
  } catch (error) {
    console.error("Error setting up test device:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set up test device",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/test-notifications/send/:type
 * @desc    Test individual notification types
 * @access  Admin
 */
router.post("/send/:type", adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { userId, customVariables = {} } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
        hint: "Use POST /api/test-notifications/setup-device to create a test user first",
      });
    }

    // Notification type configurations with realistic test data
    const notificationConfigs = {
      // Transactional notifications
      order_confirmed: {
        templateId: "ORDER_CONFIRMED",
        variables: {
          orderNumber: `ORD${Date.now().toString().slice(-6)}`,
          itemCount: "3",
          totalAmount: "45000",
          estimatedDelivery: "5-7 business days",
          orderId: `60f${Math.random().toString(36).substr(2, 21)}`,
        },
      },
      order_shipped: {
        templateId: "ORDER_SHIPPED",
        variables: {
          orderNumber: `ORD${Date.now().toString().slice(-6)}`,
          totalAmount: "45000",
          trackingId: `TRK${Math.random()
            .toString(36)
            .substr(2, 8)
            .toUpperCase()}`,
          orderId: `60f${Math.random().toString(36).substr(2, 21)}`,
        },
      },

      // User-specific notifications
      cart_abandonment_1h: {
        templateId: "CART_ABANDONMENT_1H",
        variables: {
          itemCount: "2",
          totalValue: "25000",
        },
      },
      cart_abandonment_24h: {
        templateId: "CART_ABANDONMENT_24H",
        variables: {
          itemCount: "2",
          totalValue: "25000",
        },
      },
      wishlist_price_drop: {
        templateId: "WISHLIST_PRICE_DROP",
        variables: {
          productName: "Gold Diamond Necklace",
          newPrice: "35000",
          savings: "5000",
          productId: "60f7b3d4e1b2c3d4e5f6g7h8",
        },
      },
      back_in_stock: {
        templateId: "BACK_IN_STOCK",
        variables: {
          productName: "Elegant Gold Earrings",
          price: "15000",
          productId: "60f7b3d4e1b2c3d4e5f6g7h9",
        },
      },

      // Promotional notifications
      daily_gold_price: {
        templateId: "DAILY_GOLD_PRICE",
        variables: {
          goldPrice: "6850",
          priceChange: Math.random() > 0.5 ? "increased" : "decreased",
          changeAmount: Math.floor(Math.random() * 100 + 10).toString(),
          priceMessage:
            Math.random() > 0.5
              ? "Great time to sell your gold!"
              : "Perfect opportunity to buy gold!",
        },
      },
      new_collection_launch: {
        templateId: "NEW_COLLECTION_LAUNCH",
        variables: {
          collectionName: "Diwali Special",
          itemCount: "25",
          startingPrice: "12000",
          collectionSlug: "diwali-special-2024",
        },
      },
      festival_wishes: {
        templateId: "FESTIVAL_WISHES",
        variables: {
          festivalName: "Diwali",
          discount: "15",
          festivalSlug: "diwali-2024",
        },
      },

      // Engagement notifications
      re_engagement: {
        templateId: "RE_ENGAGEMENT",
        variables: {},
      },
    };

    const config = notificationConfigs[type.toLowerCase()];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Unknown notification type: ${type}`,
        availableTypes: Object.keys(notificationConfigs),
        hint: "Check GET /api/test-notifications/ for all available types",
      });
    }

    // Merge custom variables
    const finalVariables = { ...config.variables, ...customVariables };

    console.log(`🧪 Testing ${type} notification for user: ${userId}`);

    // Check if notification service is ready
    if (!NotificationService.isReady()) {
      return res.status(503).json({
        success: false,
        message: "Notification service not ready",
        hint: "Check Firebase configuration and restart the service",
      });
    }

    // Find the template
    const template = await NotificationTemplate.findOne({
      templateId: config.templateId,
      status: "active",
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template ${config.templateId} not found or inactive`,
        hint: "Check if the template exists and is active",
      });
    }

    // Check if user has active devices
    const userDevices = await UserDevice.find({
      userId: userId,
      isActive: true,
      "tokenStatus.isActive": true,
      "preferences.enabled": true,
    });

    if (userDevices.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active devices found for user ${userId}`,
        suggestion:
          "Use POST /api/test-notifications/setup-device to create a test device first",
      });
    }

    // Send the notification
    const result = await NotificationService.sendNotification({
      userId: userId,
      templateId: template._id,
      variables: finalVariables,
      priority: "normal",
      source: "manual",
    });

    res.json({
      success: result.success,
      message: result.success
        ? `${type} notification sent successfully`
        : `Failed to send ${type} notification`,
      notificationType: type,
      templateId: config.templateId,
      variables: finalVariables,
      targetDevices: userDevices.length,
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error testing ${req.params.type} notification:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to test ${req.params.type} notification`,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/test-notifications/send-all
 * @desc    Test all notification types for comprehensive validation
 * @access  Admin
 */
router.post("/send-all", adminAuth, async (req, res) => {
  try {
    const { userId, delay = 1000 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
        hint: "Use POST /api/test-notifications/setup-device to create a test user first",
      });
    }

    console.log(`Running comprehensive notification tests for user: ${userId}`);

    // Check if notification service is ready
    if (!NotificationService.isReady()) {
      return res.status(503).json({
        success: false,
        message: "Notification service not ready",
        hint: "Check Firebase configuration and restart the service",
      });
    }

    // Check if user has active devices
    const userDevices = await UserDevice.find({
      userId: userId,
      isActive: true,
      "tokenStatus.isActive": true,
      "preferences.enabled": true,
    });

    if (userDevices.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active devices found for user ${userId}`,
        suggestion:
          "Use POST /api/test-notifications/setup-device to create a test device first",
      });
    }

    const testTypes = [
      "daily_gold_price",
      "cart_abandonment_1h",
      "order_confirmed",
      "wishlist_price_drop",
      "new_collection_launch",
      "back_in_stock",
      "festival_wishes",
      "re_engagement",
      "order_shipped",
      "cart_abandonment_24h",
    ];

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const testType of testTypes) {
      try {
        // Make internal request to individual test endpoint
        const testResponse = await new Promise((resolve, reject) => {
          const req = {
            params: { type: testType },
            body: { userId },
            user: req.user, // Pass admin user context
          };

          const res = {
            json: resolve,
            status: (code) => ({ json: resolve }),
          };

          // Call the individual test handler
          router.stack
            .find(
              (layer) =>
                layer.route?.path === "/send/:type" &&
                layer.route?.methods?.post
            )
            .route.stack[1].handle(req, res)
            .catch(reject);
        });

        if (testResponse.success) {
          successCount++;
          results.push({
            type: testType,
            status: "success",
            ...testResponse,
          });
        } else {
          failureCount++;
          results.push({
            type: testType,
            status: "failed",
            error: testResponse.message || testResponse.error,
          });
        }

        // Add delay between notifications to avoid rate limiting
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        failureCount++;
        results.push({
          type: testType,
          status: "error",
          error: error.message,
        });
      }
    }

    res.json({
      success: successCount > 0,
      message: `Comprehensive test completed: ${successCount} successful, ${failureCount} failed`,
      summary: {
        totalTested: testTypes.length,
        successful: successCount,
        failed: failureCount,
        targetUserId: userId,
        targetDevices: userDevices.length,
      },
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in comprehensive notification test:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run comprehensive notification test",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/test-notifications/gold-price
 * @desc    Test gold price notifications with real or simulated data
 * @access  Admin
 */
router.post("/gold-price", adminAuth, async (req, res) => {
  try {
    const {
      userId,
      useRealData = false,
      simulatedPrice = 6850,
      simulatedChange = "increased",
      simulatedAmount = "75",
    } = req.body;
    let _useRealData = useRealData;
    console.log(
      `Testing gold price notifications (useRealData: ${_useRealData})`
    );

    let goldPriceData;
    let variables;

    if (_useRealData) {
      try {
        // Use the automated service to get real gold price data
        const result =
          await AutomatedNotificationService.sendDailyGoldPriceUpdate();

        if (result.sent > 0) {
          return res.json({
            success: true,
            message: "Real gold price notifications sent successfully",
            result: result,
            type: "real_data_broadcast",
          });
        } else {
          throw new Error(result.error || "No notifications sent");
        }
      } catch (error) {
        console.warn(
          "Failed to use real gold price data, falling back to simulation:",
          error.message
        );
        _useRealData = false;
      }
    }

    if (!_useRealData) {
      // Use simulated data for testing
      console.log("no gold price data, using simulated values");
      variables = {
        goldPrice: simulatedPrice.toString(),
        priceChange: simulatedChange,
        changeAmount: simulatedAmount.toString(),
        priceMessage:
          simulatedChange === "increased"
            ? "Great time to sell your gold!"
            : "Perfect opportunity to buy gold!",
      };
    }

    // If userId provided, send to specific user, otherwise broadcast
    if (userId) {
      const template = await NotificationTemplate.findOne({
        templateId: "DAILY_GOLD_PRICE",
        status: "active",
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Daily gold price template not found",
        });
      }

      const result = await NotificationService.sendNotification({
        userId: userId,
        templateId: template._id,
        variables: variables,
        priority: "normal",
        source: "manual",
      });

      res.json({
        success: result.success,
        message: result.success
          ? "Gold price notification sent to specific user"
          : "Failed to send gold price notification",
        targetUser: userId,
        variables: variables,
        result: result,
      });
    } else {
      console.log("If no userId provided, broadcasting to all eligible users");
      // Broadcast to all eligible users (like the real automated service)
      const interestedDevices = await UserDevice.find({
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.promotional": true,
      }).limit(10); // Limit for testing
      console.log(`Found ${interestedDevices.length} devices for broadcast`);
      let sentCount = 0;
      let failedCount = 0;
      const results = [];

      for (const device of interestedDevices) {
        try {
          const result = await NotificationService.sendNotification({
            userId: device.userId,
            templateId: (
              await NotificationTemplate.findOne({
                templateId: "DAILY_GOLD_PRICE",
              })
            )._id,
            variables: variables,
            priority: "normal",
            source: "manual",
          });
          console.log(`Sent to user ${device.userId}:`, result);
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
          results.push({ userId: device.userId, ...result });
        } catch (error) {
          failedCount++;
          results.push({
            userId: device.userId,
            success: false,
            error: error.message,
          });
        }
      }
      console.log(
        `Broadcast completed: ${sentCount} sent, ${failedCount} failed`
      );
      res.json({
        success: sentCount > 0,
        message: `Gold price broadcast completed: ${sentCount} sent, ${failedCount} failed`,
        type: "broadcast_test",
        variables: variables,
        summary: {
          totalTargeted: interestedDevices.length,
          sent: sentCount,
          failed: failedCount,
        },
        results: results,
      });
    }
  } catch (error) {
    console.error("Error testing gold price notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test gold price notifications",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/test-notifications/ecommerce-flow
 * @desc    Test complete e-commerce notification flow
 * @access  Admin
 */
router.post("/ecommerce-flow", adminAuth, async (req, res) => {
  try {
    const { userId, flowDelay = 2000 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required for e-commerce flow test",
      });
    }

    console.log(`🛒 Testing e-commerce notification flow for user: ${userId}`);

    const flowSteps = [
      {
        step: 1,
        name: "Cart Abandonment (1 hour)",
        type: "cart_abandonment_1h",
        description: "User added items to cart but didn't checkout",
      },
      {
        step: 2,
        name: "Cart Abandonment (24 hours)",
        type: "cart_abandonment_24h",
        description: "Follow-up with discount offer",
      },
      {
        step: 3,
        name: "Order Confirmation",
        type: "order_confirmed",
        description: "User completed purchase",
      },
      {
        step: 4,
        name: "Order Shipped",
        type: "order_shipped",
        description: "Order dispatched with tracking",
      },
    ];

    const results = [];

    for (const flowStep of flowSteps) {
      try {
        console.log(`📦 Step ${flowStep.step}: ${flowStep.name}`);

        // Make request to individual notification endpoint
        const stepResult = await new Promise((resolve) => {
          const testReq = {
            params: { type: flowStep.type },
            body: { userId },
            user: req.user,
          };

          const testRes = {
            json: resolve,
            status: (code) => ({ json: resolve }),
          };

          // Find and call the individual test handler
          const handler = router.stack.find(
            (layer) =>
              layer.route?.path === "/send/:type" && layer.route?.methods?.post
          ).route.stack[1].handle;

          handler(testReq, testRes);
        });

        results.push({
          ...flowStep,
          result: stepResult,
          timestamp: new Date().toISOString(),
        });

        // Delay between steps to simulate real flow timing
        if (flowDelay > 0 && flowStep.step < flowSteps.length) {
          await new Promise((resolve) => setTimeout(resolve, flowDelay));
        }
      } catch (error) {
        results.push({
          ...flowStep,
          result: { success: false, error: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    }

    const successfulSteps = results.filter((r) => r.result.success).length;

    res.json({
      success: successfulSteps > 0,
      message: `E-commerce flow completed: ${successfulSteps}/${flowSteps.length} steps successful`,
      flow: "cart_abandonment -> order_confirmation -> shipping",
      userId: userId,
      summary: {
        totalSteps: flowSteps.length,
        successful: successfulSteps,
        failed: flowSteps.length - successfulSteps,
      },
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error testing e-commerce flow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test e-commerce flow",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/test-notifications/service-status
 * @desc    Get detailed status of notification services for testing
 * @access  Admin
 */
router.get("/service-status", adminAuth, async (req, res) => {
  try {
    // Check base notification service
    let baseServiceStatus;
    try {
      baseServiceStatus = {
        initialized: NotificationService.isInitialized || false,
        ready: NotificationService.isReady(),
        messaging: !!NotificationService.messaging,
      };

      if (NotificationService.isReady()) {
        const connectionTest = await NotificationService.validateConnection();
        baseServiceStatus.connection = connectionTest;
      }
    } catch (error) {
      baseServiceStatus = { error: error.message };
    }

    // Check automated service
    let automatedServiceStatus;
    try {
      automatedServiceStatus = {
        initialized: AutomatedNotificationService.isInitialized,
        canSendNotifications:
          AutomatedNotificationService.canSendNotifications(),
        scheduledJobs: AutomatedNotificationService.scheduledJobs?.size || 0,
      };
    } catch (error) {
      automatedServiceStatus = { error: error.message };
    }

    // Get database stats
    const [totalTemplates, activeTemplates, totalDevices, activeDevices] =
      await Promise.all([
        NotificationTemplate.countDocuments(),
        NotificationTemplate.countDocuments({ status: "active" }),
        UserDevice.countDocuments(),
        UserDevice.countDocuments({
          isActive: true,
          "tokenStatus.isActive": true,
        }),
      ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        notificationService: baseServiceStatus,
        automatedService: automatedServiceStatus,
      },
      database: {
        templates: {
          total: totalTemplates,
          active: activeTemplates,
        },
        devices: {
          total: totalDevices,
          active: activeDevices,
        },
      },
      testing: {
        available:
          baseServiceStatus.ready && activeTemplates > 0 && activeDevices > 0,
        recommendations: [],
      },
    });
  } catch (error) {
    console.error("Error getting service status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get service status",
      error: error.message,
    });
  }
});

module.exports = router;
