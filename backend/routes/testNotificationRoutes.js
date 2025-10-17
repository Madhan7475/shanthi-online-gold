// backend/routes/testNotificationRoutes.js
const express = require("express");
const router = express.Router();
const NotificationService = require("../services/NotificationService");
const NotificationManager = require("../services/NotificationManager");
const AutomatedNotificationService = require("../services/AutomatedNotificationService");
const NotificationTemplate = require("../models/NotificationTemplate");
const UserDevice = require("../models/UserDevice");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");
const { NOTIFICATION_TOPICS, isValidTopic } = require("../constants/notificationTopics");

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
router.post("/send/:type", async (req, res) => {
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
      // INDIVIDUAL DELIVERY - Transactional notifications
      order_confirmed: {
        templateId: "ORDER_CONFIRMED",
        deliveryType: "individual",
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
        deliveryType: "individual",
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
      order_processing: {
        templateId: "ORDER_PROCESSING",
        deliveryType: "individual",
        variables: {
          orderNumber: `ORD${Date.now().toString().slice(-6)}`,
          orderId: `60f${Math.random().toString(36).substr(2, 21)}`,
          totalAmount: "45000",
          itemCount: "3",
          estimatedDelivery: "3-5 business days",
        },
      },
      order_delivered: {
        templateId: "ORDER_DELIVERED",
        deliveryType: "individual",
        variables: {
          orderNumber: `ORD${Date.now().toString().slice(-6)}`,
          orderId: `60f${Math.random().toString(36).substr(2, 21)}`,
          deliveredAt: new Date().toLocaleDateString(),
          deliveredTo: "Test Customer",
          totalAmount: "45000",
        },
      },
      order_payment_failed: {
        templateId: "ORDER_PAYMENT_FAILED",
        deliveryType: "individual",
        variables: {
          orderNumber: `ORD${Date.now().toString().slice(-6)}`,
          orderId: `60f${Math.random().toString(36).substr(2, 21)}`,
          totalAmount: "45000",
          errorMessage: "Payment was declined by your bank. Please try with a different card.",
        },
      },

      // INDIVIDUAL DELIVERY - User-specific notifications
      cart_abandonment_1h: {
        templateId: "CART_ABANDONMENT_1H",
        deliveryType: "individual",
        variables: {
          itemCount: "2",
          totalValue: "25000",
        },
      },
      cart_abandonment_24h: {
        templateId: "CART_ABANDONMENT_24H",
        deliveryType: "individual",
        variables: {
          itemCount: "2",
          totalValue: "25000",
        },
      },
      wishlist_price_drop: {
        templateId: "WISHLIST_PRICE_DROP",
        deliveryType: "individual",
        variables: {
          productName: "Gold Diamond Necklace",
          newPrice: "35000",
          savings: "5000",
          productId: "60f7b3d4e1b2c3d4e5f6g7h8",
        },
      },
      back_in_stock: {
        templateId: "BACK_IN_STOCK",
        deliveryType: "individual",
        variables: {
          productName: "Elegant Gold Earrings",
          price: "15000",
          productId: "60f7b3d4e1b2c3d4e5f6g7h9",
        },
      },

      // TOPIC DELIVERY - Promotional notifications
      daily_gold_price: {
        templateId: "DAILY_GOLD_PRICE",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.PROMOTIONAL,
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
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.PROMOTIONAL,
        variables: {
          collectionName: "Diwali Special",
          itemCount: "25",
          startingPrice: "12000",
          collectionSlug: "diwali-special-2024",
        },
      },
      promotional_offer: {
        templateId: "PROMOTIONAL_OFFER",
        deliveryType: "topic", 
        topic: NOTIFICATION_TOPICS.PROMOTIONAL,
        variables: {
          offerTitle: "Diwali Gold Sale",
          discount: "20",
          validUntil: "31st October 2024",
          offerCode: "DIWALI20",
        },
      },

      // TOPIC DELIVERY - Seasonal notifications
      festival_wishes: {
        templateId: "FESTIVAL_WISHES",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.SEASONAL,
        variables: {
          festivalName: "Diwali",
          discount: "15",
          festivalSlug: "diwali-2024",
        },
      },
      seasonal_campaign: {
        templateId: "SEASONAL_CAMPAIGN",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.SEASONAL,
        variables: {
          campaignName: "Wedding Season Special",
          discount: "25",
          validUntil: "30th November 2024",
        },
      },

      // TOPIC DELIVERY - Engagement notifications
      re_engagement: {
        templateId: "RE_ENGAGEMENT",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.ENGAGEMENT,
        variables: {
          lastVisit: "2 weeks ago",
          specialOffer: "10% off your next purchase",
        },
      },
      educational_content: {
        templateId: "EDUCATIONAL_CONTENT",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.ENGAGEMENT,
        variables: {
          contentTitle: "How to Care for Your Gold Jewelry",
          contentSlug: "gold-jewelry-care-tips",
        },
      },

      // TOPIC DELIVERY - General announcements
      general_announcement: {
        templateId: "GENERAL_ANNOUNCEMENT",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.ALL_USERS,
        variables: {
          title: "Important Update",
          message: "We've updated our delivery policies for better service",
          actionUrl: "https://shanthionlinegold.com/delivery-policy",
        },
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

    console.log(`🧪 Testing ${type} notification (${config.deliveryType} delivery)`);

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

    let result;

    if (config.deliveryType === "topic") {
      // TOPIC-BASED DELIVERY for promotional, seasonal, engagement
      if (!isValidTopic(config.topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic: ${config.topic}`,
          validTopics: Object.values(NOTIFICATION_TOPICS),
        });
      }

      console.log(`📢 Sending topic notification to: ${config.topic}`);

      // Use NotificationManager for unified experience (includes queue processing)
      result = await NotificationManager.sendNotification({
        type: type.toLowerCase(),
        trigger: 'manual',
        data: {
          ...finalVariables,
          deliveryType: 'topic',
          topic: config.topic,
        },
        recipients: null, // Not needed for topics
        options: {
          priority: 'normal',
          source: 'test'
        }
      });

      // Count estimated recipients for testing feedback
      const estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        [`preferences.${type.includes('gold_price') || type.includes('collection') || type.includes('promotional') ? 'promotional' : 
          type.includes('festival') || type.includes('seasonal') ? 'seasonal' : 
          type.includes('engagement') || type.includes('educational') ? 'engagement' : 'promotional'}`]: true,
      });

      return res.json({
        success: result.success,
        message: result.success
          ? `${type} topic notification sent successfully to ${config.topic}`
          : `Failed to send ${type} topic notification`,
        notificationType: type,
        deliveryType: "topic",
        topic: config.topic,
        templateId: config.templateId,
        variables: finalVariables,
        estimatedRecipients: estimatedRecipients,
        result: result,
        timestamp: new Date().toISOString(),
      });

    } else {
      // INDIVIDUAL DELIVERY for transactional, user-specific
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required for individual notifications",
          hint: "Use POST /api/test-notifications/setup-device to create a test user first",
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

      console.log(`👤 Sending individual notification to user: ${userId}`);

      // Send individual notification
      result = await NotificationService.sendNotification({
        userId: userId,
        templateId: template._id,
        variables: finalVariables,
        priority: "normal",
        source: "test",
      });

      return res.json({
        success: result.success,
        message: result.success
          ? `${type} notification sent successfully`
          : `Failed to send ${type} notification`,
        notificationType: type,
        deliveryType: "individual",
        templateId: config.templateId,
        variables: finalVariables,
        targetDevices: userDevices.length,
        targetUserId: userId,
        result: result,
        timestamp: new Date().toISOString(),
      });
    }
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
      // Topic-based notifications (broadcast)
      "daily_gold_price",        // → promotional topic
      "new_collection_launch",   // → promotional topic  
      "promotional_offer",       // → promotional topic
      "festival_wishes",         // → seasonal topic
      "seasonal_campaign",       // → seasonal topic
      "re_engagement",          // → engagement topic
      "educational_content",     // → engagement topic
      "general_announcement",   // → all_users topic
      
      // Individual notifications (personal)
      "cart_abandonment_1h",    // → individual delivery
      "cart_abandonment_24h",   // → individual delivery
      "order_confirmed",        // → individual delivery
      "order_shipped",          // → individual delivery
      "wishlist_price_drop",    // → individual delivery
      "back_in_stock",          // → individual delivery
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

    // If userId provided, send to specific user, otherwise use topic broadcast
    if (userId) {
      // Individual test for specific user
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
        source: "test",
      });

      res.json({
        success: result.success,
        message: result.success
          ? "Gold price notification sent to specific user"
          : "Failed to send gold price notification",
        deliveryType: "individual",
        targetUser: userId,
        variables: variables,
        result: result,
      });
    } else {
      // TOPIC BROADCAST - Use new topic-based delivery
      console.log("Broadcasting gold price update using topic delivery");
      
      const result = await NotificationManager.sendNotification({
        type: 'gold_price',
        trigger: 'manual',
        data: {
          ...variables,
          deliveryType: 'topic'
        },
        recipients: null, // Not needed for topics
        options: {
          priority: 'normal',
          source: 'test'
        }
      });

      // Get estimated recipients for feedback
      const estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.promotional": true, // Gold price updates are promotional
      });

      res.json({
        success: result.success,
        message: result.success
          ? `Gold price topic broadcast sent successfully`
          : "Failed to send gold price topic broadcast",
        deliveryType: "topic",
        topic: NOTIFICATION_TOPICS.PROMOTIONAL,
        variables: variables,
        estimatedRecipients: estimatedRecipients,
        result: result,
        performance: {
          method: "topic_broadcast",
          improvement: `1 FCM call instead of ${estimatedRecipients} individual calls`,
          efficiency: estimatedRecipients > 0 ? `${(((estimatedRecipients - 1) / estimatedRecipients) * 100).toFixed(1)}% reduction` : "N/A"
        }
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

/**
 * @route   POST /api/test-notifications/topic/:topic
 * @desc    Test topic-based notifications directly
 * @access  Admin
 */
router.post("/topic/:topic", async (req, res) => {
  try {
    const { topic } = req.params;
    const { templateId = "DAILY_GOLD_PRICE", variables = {} } = req.body;

    // Validate topic
    if (!isValidTopic(topic)) {
      return res.status(400).json({
        success: false,
        message: `Invalid topic: ${topic}`,
        validTopics: Object.values(NOTIFICATION_TOPICS),
        hint: "Use one of the predefined topics"
      });
    }

    console.log(`🧪 Testing direct topic notification to: ${topic}`);

    // Find the template
    const template = await NotificationTemplate.findOne({
      templateId: templateId,
      status: "active",
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template ${templateId} not found or inactive`,
      });
    }

    // Send topic notification
    const result = await NotificationService.sendTopicNotification({
      topic: topic,
      templateId: template._id,
      variables: variables,
      priority: "normal",
      source: "test",
    });

    // Get estimated recipients for the topic
    let estimatedRecipients = 0;
    
    if (topic === NOTIFICATION_TOPICS.ALL_USERS) {
      estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
      });
    } else if (topic === NOTIFICATION_TOPICS.PROMOTIONAL) {
      estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.promotional": true,
      });
    } else if (topic === NOTIFICATION_TOPICS.SEASONAL) {
      estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.seasonal": true,
      });
    } else if (topic === NOTIFICATION_TOPICS.ENGAGEMENT) {
      estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.engagement": true,
      });
    } else {
      // Platform or segment topics - estimate based on all active devices
      estimatedRecipients = await UserDevice.countDocuments({
        isActive: true,
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
      });
    }

    res.json({
      success: result.success,
      message: result.success
        ? `Topic notification sent successfully to ${topic}`
        : `Failed to send topic notification`,
      topic: topic,
      templateId: templateId,
      variables: variables,
      estimatedRecipients: estimatedRecipients,
      performance: {
        fcmCalls: 1,
        alternativeIndividualCalls: estimatedRecipients,
        efficiency: estimatedRecipients > 0 ? `${(((estimatedRecipients - 1) / estimatedRecipients) * 100).toFixed(1)}% reduction in API calls` : "N/A"
      },
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error testing topic notification:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to test topic notification`,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/test-notifications/topics
 * @desc    Get available topics and their estimated subscriber counts
 * @access  Admin
 */
router.get("/topics", async (req, res) => {
  try {
    const topics = [];

    for (const [key, topic] of Object.entries(NOTIFICATION_TOPICS)) {
      let subscriberCount = 0;
      let description = "";

      switch (topic) {
        case NOTIFICATION_TOPICS.ALL_USERS:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
          });
          description = "All active users with notifications enabled";
          break;

        case NOTIFICATION_TOPICS.PROMOTIONAL:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
            "preferences.promotional": true,
          });
          description = "Users who enabled promotional notifications (gold prices, offers)";
          break;

        case NOTIFICATION_TOPICS.SEASONAL:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
            "preferences.seasonal": true,
          });
          description = "Users who enabled seasonal notifications (festivals, occasions)";
          break;

        case NOTIFICATION_TOPICS.ENGAGEMENT:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
            "preferences.engagement": true,
          });
          description = "Users who enabled engagement notifications (tips, education)";
          break;

        case NOTIFICATION_TOPICS.IOS_USERS:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
            "deviceInfo.platform": "ios",
          });
          description = "iOS platform users";
          break;

        case NOTIFICATION_TOPICS.ANDROID_USERS:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
            "deviceInfo.platform": "android",
          });
          description = "Android platform users";
          break;

        default:
          subscriberCount = await UserDevice.countDocuments({
            isActive: true,
            "tokenStatus.isActive": true,
            "preferences.enabled": true,
          });
          description = "Estimated subscriber count";
      }

      topics.push({
        key,
        topic,
        subscriberCount,
        description,
        testEndpoint: `/api/test-notifications/topic/${topic}`,
        efficiency: subscriberCount > 1 ? `${(((subscriberCount - 1) / subscriberCount) * 100).toFixed(1)}% reduction vs individual` : "N/A"
      });
    }

    res.json({
      success: true,
      message: "Available Firebase notification topics",
      topics: topics,
      summary: {
        totalTopics: topics.length,
        totalPotentialSubscribers: topics.reduce((sum, t) => sum + t.subscriberCount, 0),
        mostPopularTopic: topics.reduce((max, t) => t.subscriberCount > max.subscriberCount ? t : max, topics[0]),
      },
      usage: {
        directTopicTest: "POST /api/test-notifications/topic/:topic",
        automaticRouting: "POST /api/test-notifications/send/:type (uses topics automatically)",
      }
    });
  } catch (error) {
    console.error("Error getting topic information:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get topic information",
      error: error.message,
    });
  }
});

module.exports = router;
