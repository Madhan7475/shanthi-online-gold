// backend/services/AutomatedNotificationService.js
const NotificationService = require("./NotificationService");
const NotificationTemplate = require("../models/NotificationTemplate");
const UserDevice = require("../models/UserDevice");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const User = require("../models/User");
const cron = require("node-cron");

class AutomatedNotificationService {
  constructor() {
    this.isInitialized = false;
    this.scheduledJobs = new Map();
  }

  /**
   * Initialize automated notification service and start scheduled jobs
   */
  async initialize() {
    if (this.isInitialized) {
      console.log(
        "Automated Notification Service already initialized, skipping..."
      );
      return;
    }

    try {
      console.log("Initializing Automated Notification Service...");

      // Stop any existing jobs first (safety measure)
      this.stop();

      // Initialize base notification service (but don't fail if it can't initialize)
      try {
        await NotificationService.initialize();
        console.log("Base notification service ready");
      } catch (error) {
        console.warn(
          "Base notification service initialization failed, continuing without notifications:",
          error.message
        );
      }

      // Create default templates if they don't exist
      await this.createDefaultTemplates();

      // Start scheduled jobs
      this.startScheduledJobs();

      this.isInitialized = true;
      console.log("Automated Notification Service initialized successfully");
    } catch (error) {
      console.error(
        "Failed to initialize Automated Notification Service:",
        error
      );
      console.warn("Automated notifications will be disabled");
      // Don't throw error - allow app to start without automated notifications
      this.isInitialized = false;
    }
  }

  /**
   * Check if the service is ready to send notifications
   */
  canSendNotifications() {
    try {
      return (
        this.isInitialized &&
        NotificationService &&
        typeof NotificationService.isReady === "function" &&
        NotificationService.isReady()
      );
    } catch (error) {
      console.warn(
        "Error checking notification service readiness:",
        error.message
      );
      return false;
    }
  }

  /**
   * Safe wrapper for sending notifications
   */
  async safeNotificationSend(notificationData) {
    try {
      if (!this.canSendNotifications()) {
        console.warn(
          "Notification service not ready, skipping notification send"
        );
        return { success: false, error: "Service not ready" };
      }

      if (typeof NotificationService.sendNotification !== "function") {
        console.error("NotificationService.sendNotification is not available");
        return { success: false, error: "Send method not available" };
      }

      return await NotificationService.sendNotification(notificationData);
    } catch (error) {
      console.error("Error in safe notification send:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create default notification templates for jewelry e-commerce
   */
  async createDefaultTemplates() {
    const defaultTemplates = [
      {
        templateId: "CART_ABANDONMENT_1H",
        name: "Cart Abandonment - 1 Hour",
        description:
          "Sent 1 hour after user adds items to cart but doesn't checkout",
        type: "user_specific",
        title: "Your beautiful jewelry is waiting!",
        body: "Don't miss out on {{itemCount}} stunning pieces in your cart. Complete your purchase now and get FREE shipping!",
        action: {
          type: "deep_link",
          value: "/cart",
          buttonText: "Complete Purchase",
        },
        variables: [
          {
            key: "itemCount",
            description: "Number of items in cart",
            required: true,
          },
          {
            key: "totalValue",
            description: "Total cart value",
            required: false,
          },
        ],
        targeting: {
          userSegments: ["cart_abandoners"],
        },
        status: "active",
      },
      {
        templateId: "CART_ABANDONMENT_24H",
        name: "Cart Abandonment - 24 Hours",
        description: "Sent 24 hours after cart abandonment with discount offer",
        type: "user_specific",
        title: "Still thinking? Get 5% off your jewelry!",
        body: "Your {{itemCount}} selected pieces are still waiting. Use code SAVE5 for 5% off your ₹{{totalValue}} order!",
        action: {
          type: "deep_link",
          value: "/cart?discount=SAVE5",
          buttonText: "Claim Discount",
        },
        variables: [
          {
            key: "itemCount",
            description: "Number of items in cart",
            required: true,
          },
          {
            key: "totalValue",
            description: "Total cart value",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["cart_abandoners"],
        },
        status: "active",
      },
      {
        templateId: "WISHLIST_PRICE_DROP",
        name: "Wishlist Price Drop Alert",
        description: "Notify when wishlist item price drops",
        type: "user_specific",
        title: "Price Drop Alert!",
        body: "{{productName}} in your wishlist is now ₹{{newPrice}}! Save ₹{{savings}} on this beautiful piece.",
        action: {
          type: "deep_link",
          value: "/product/{{productId}}",
          buttonText: "Buy Now",
        },
        variables: [
          { key: "productName", description: "Product name", required: true },
          {
            key: "newPrice",
            description: "New discounted price",
            required: true,
          },
          { key: "savings", description: "Amount saved", required: true },
          {
            key: "productId",
            description: "Product ID for deep link",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["active_users"],
        },
        status: "active",
      },
      {
        templateId: "DAILY_GOLD_PRICE",
        name: "Daily Gold Price Update",
        description: "Daily gold price notification for engaged users",
        type: "promotional",
        title: "Today's Gold Rate: ₹{{goldPrice}}/gram",
        body: "Gold {{priceChange}} by ₹{{changeAmount}}/gram today. {{priceMessage}}",
        action: {
          type: "deep_link",
          value: "/gold-prices",
          buttonText: "View Details",
        },
        variables: [
          {
            key: "goldPrice",
            description: "Current gold price per gram",
            required: true,
          },
          {
            key: "priceChange",
            description: "increased/decreased",
            required: true,
          },
          { key: "changeAmount", description: "Change amount", required: true },
          {
            key: "priceMessage",
            description: "Contextual message about price",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["active_users", "premium_customers"],
        },
        scheduling: {
          allowedDays: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ],
          allowedTimeSlots: [{ start: "09:00", end: "10:00" }],
        },
        status: "active",
      },
      {
        templateId: "NEW_COLLECTION_LAUNCH",
        name: "New Collection Launch",
        description: "Notify about new jewelry collection launches",
        type: "promotional",
        title: "New {{collectionName}} Collection is Here!",
        body: "Discover {{itemCount}} stunning new pieces starting from ₹{{startingPrice}}. Be the first to explore!",
        action: {
          type: "deep_link",
          value: "/collections/{{collectionSlug}}",
          buttonText: "Explore Collection",
        },
        variables: [
          {
            key: "collectionName",
            description: "Collection name",
            required: true,
          },
          {
            key: "itemCount",
            description: "Number of items in collection",
            required: true,
          },
          {
            key: "startingPrice",
            description: "Starting price of collection",
            required: true,
          },
          {
            key: "collectionSlug",
            description: "Collection URL slug",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["active_users", "premium_customers"],
        },
        status: "active",
      },
      {
        templateId: "ORDER_CONFIRMED",
        name: "Order Confirmation",
        description: "Order confirmation notification",
        type: "transactional",
        title: "Order Confirmed! Order #{{orderNumber}}",
        body: "Your order of {{itemCount}} beautiful pieces worth ₹{{totalAmount}} has been confirmed. Estimated delivery: {{estimatedDelivery}}",
        action: {
          type: "deep_link",
          value: "/orders/{{orderId}}",
          buttonText: "Track Order",
        },
        variables: [
          { key: "orderNumber", description: "Order number", required: true },
          { key: "itemCount", description: "Number of items", required: true },
          {
            key: "totalAmount",
            description: "Total order amount",
            required: true,
          },
          {
            key: "estimatedDelivery",
            description: "Estimated delivery date",
            required: true,
          },
          {
            key: "orderId",
            description: "Order ID for tracking",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["all"],
        },
        status: "active",
      },
      {
        templateId: "ORDER_SHIPPED",
        name: "Order Shipped",
        description: "Order shipping notification",
        type: "transactional",
        title: "Your Order is On Its Way!",
        body: "Order #{{orderNumber}} has been shipped! Track your ₹{{totalAmount}} jewelry order with tracking ID: {{trackingId}}",
        action: {
          type: "deep_link",
          value: "/orders/{{orderId}}/track",
          buttonText: "Track Package",
        },
        variables: [
          { key: "orderNumber", description: "Order number", required: true },
          {
            key: "totalAmount",
            description: "Total order amount",
            required: true,
          },
          {
            key: "trackingId",
            description: "Shipping tracking ID",
            required: true,
          },
          { key: "orderId", description: "Order ID", required: true },
        ],
        targeting: {
          userSegments: ["all"],
        },
        status: "active",
      },
      {
        templateId: "BACK_IN_STOCK",
        name: "Back in Stock Alert",
        description: "Notify when out-of-stock wishlist items are back",
        type: "user_specific",
        title: "{{productName}} is Back in Stock!",
        body: "Great news! {{productName}} from your wishlist is now available for ₹{{price}}. Hurry, limited stock!",
        action: {
          type: "deep_link",
          value: "/product/{{productId}}",
          buttonText: "Buy Now",
        },
        variables: [
          { key: "productName", description: "Product name", required: true },
          { key: "price", description: "Product price", required: true },
          { key: "productId", description: "Product ID", required: true },
        ],
        targeting: {
          userSegments: ["active_users"],
        },
        status: "active",
      },
      {
        templateId: "FESTIVAL_WISHES",
        name: "Festival Wishes",
        description: "Festival greetings with special offers",
        type: "seasonal",
        title: "Happy {{festivalName}}!",
        body: "Celebrate {{festivalName}} with our exclusive {{discount}}% off on all jewelry! Make this festival more special.",
        action: {
          type: "deep_link",
          value: "/festival-sale/{{festivalSlug}}",
          buttonText: "Shop Now",
        },
        variables: [
          { key: "festivalName", description: "Festival name", required: true },
          {
            key: "discount",
            description: "Discount percentage",
            required: true,
          },
          {
            key: "festivalSlug",
            description: "Festival sale page slug",
            required: true,
          },
        ],
        targeting: {
          userSegments: ["active_users", "premium_customers"],
        },
        status: "active",
      },
      {
        templateId: "RE_ENGAGEMENT",
        name: "Re-engagement Campaign",
        description: "Win back inactive users",
        type: "engagement",
        title: "We Miss You! Come Back for 10% Off",
        body: "It's been a while! Discover new collections and get 10% off your next purchase. Your perfect jewelry awaits!",
        action: {
          type: "deep_link",
          value: "/welcome-back?discount=COMEBACK10",
          buttonText: "Welcome Back Offer",
        },
        variables: [],
        targeting: {
          userSegments: ["inactive_users"],
        },
        status: "active",
      },
    ];

    for (const templateData of defaultTemplates) {
      try {
        const existingTemplate = await NotificationTemplate.findOne({
          templateId: templateData.templateId,
        });

        if (!existingTemplate) {
          // Try to find a system user for default templates
          const systemUser = await User.findOne({ role: "admin" });

          const template = new NotificationTemplate({
            ...templateData,
            isSystemTemplate: true,
            createdBy: systemUser?._id,
          });

          await template.save();
          console.log(`Created default template: ${templateData.name}`);
        }
      } catch (error) {
        console.error(
          `Error creating template ${templateData.templateId}:`,
          error
        );
      }
    }
  }

  /**
   * Start all scheduled notification jobs
   */
  startScheduledJobs() {
    // Prevent duplicate job creation
    if (this.scheduledJobs.size > 0) {
      console.log("Scheduled jobs already running, skipping duplicate setup");
      return;
    }

    console.log("Starting scheduled notification jobs...");

    // Note: Gold price notifications are now integrated with the existing goldPriceCron.js
    // which runs at 12:00 PM daily and triggers notifications after price refresh

    // Cart abandonment check (every hour)
    const cartAbandonmentJob = cron.schedule("0 * * * *", async () => {
      try {
        await this.checkCartAbandonment();
      } catch (error) {
        console.error("Error in cart abandonment job:", error);
      }
    });
    this.scheduledJobs.set("cart_abandonment", cartAbandonmentJob);

    // Price drop alerts (twice daily at 10 AM and 6 PM)
    const priceDropJob = cron.schedule(
      "0 10,18 * * *",
      async () => {
        try {
          await this.checkWishlistPriceDrops();
        } catch (error) {
          console.error("Error in price drop job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
    this.scheduledJobs.set("price_drops", priceDropJob);

    // Back in stock alerts (every 4 hours)
    const backInStockJob = cron.schedule("0 */4 * * *", async () => {
      try {
        await this.checkBackInStock();
      } catch (error) {
        console.error("Error in back in stock job:", error);
      }
    });
    this.scheduledJobs.set("back_in_stock", backInStockJob);

    // Re-engagement campaign (daily at 11 AM)
    const reEngagementJob = cron.schedule(
      "0 11 * * *",
      async () => {
        try {
          await this.sendReEngagementNotifications();
        } catch (error) {
          console.error("Error in re-engagement job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
    this.scheduledJobs.set("re_engagement", reEngagementJob);

    console.log("Scheduled notification jobs started");
  }

  /**
   * Send daily gold price update notifications
   */
  async sendDailyGoldPriceUpdate() {
    try {
      console.log("Sending daily gold price updates...");

      // Check if notifications can be sent
      if (!this.canSendNotifications()) {
        console.warn(
          "Notification service not ready, skipping gold price updates"
        );
        return { sent: 0, failed: 0, error: "Service not ready" };
      }

      // Import and use the existing gold price service
      const { getLatestGoldPrice } = require("./goldPriceService");

      let goldPriceData;
      try {
        goldPriceData = await getLatestGoldPrice({ allowFetch: false });
      } catch (error) {
        console.warn("No gold price data available:", error.message);
        return { sent: 0, failed: 0, error: "No price data available" };
      }

      const template = await NotificationTemplate.findOne({
        templateId: "DAILY_GOLD_PRICE",
        status: "active",
      });

      if (!template) {
        console.warn("Daily gold price template not found");
        return { sent: 0, failed: 0, error: "Template not found" };
      }

      // Calculate price change - you might want to implement proper historical tracking
      const currentPrice24k = goldPriceData.pricePerGram24kInr;
      const currentPrice22k = goldPriceData.pricePerGram22kInr;

      // Simple price change simulation (implement proper historical tracking for production)
      const estimatedChange =
        Math.random() > 0.5
          ? Math.round(Math.random() * 50 + 10)
          : -Math.round(Math.random() * 50 + 10);

      const priceChange = estimatedChange > 0 ? "increased" : "decreased";
      const changeAmount = Math.abs(estimatedChange).toString();
      const priceMessage =
        estimatedChange > 0
          ? "Prices are up! Good time to sell your gold!"
          : "Prices dropped! Great opportunity to buy gold!";

      // Get users interested in gold price updates
      const allActiveDevices = await UserDevice.find({
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.promotional": true,
        isActive: true,
      });

      // Filter by user segments (virtual property, so we need to filter after fetching)
      let interestedDevices = allActiveDevices.filter((device) => {
        const segment = device.userSegment; // This calls the virtual getter
        return (
          ["active_user", "loyal_customer", "new_user"].includes(segment) ||
          device.tags.some((tag) =>
            ["premium_customer", "gold_interested", "active_user"].includes(tag)
          )
        );
      });

      // Fallback: If no interested devices found, use all active devices for testing
      if (interestedDevices.length === 0 && allActiveDevices.length > 0) {
        console.log(
          "⚠️ No specifically interested devices found, using all active devices for testing"
        );
        interestedDevices = allActiveDevices;
      }

      console.log(
        `📱 Found ${allActiveDevices.length} active devices, filtered to ${interestedDevices.length} interested in gold notifications`
      );
      console.log(
        `💰 Current price: ₹${currentPrice24k}/gram (24K), ₹${currentPrice22k}/gram (22K)`
      );

      // Debug logging for device segments
      if (allActiveDevices.length > 0) {
        const segmentCounts = {};
        allActiveDevices.forEach((device) => {
          const segment = device.userSegment;
          segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
        });
        console.log(`📊 Device segments:`, segmentCounts);
        console.log(
          `🏷️ Sample device tags:`,
          allActiveDevices
            .slice(0, 3)
            .map((d) => ({
              userId: d.userId,
              tags: d.tags,
              segment: d.userSegment,
            }))
        );
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const device of interestedDevices) {
        try {
          const result = await this.safeNotificationSend({
            userId: device.userId,
            templateId: template._id,
            variables: {
              goldPrice: Math.round(currentPrice24k).toString(),
              priceChange: priceChange,
              changeAmount: changeAmount,
              priceMessage: priceMessage,
            },
            priority: "normal",
            source: "automated",
          });

          if (result.success) {
            sentCount++;
          } else {
            console.warn(
              `Failed to send gold price update to device ${device._id}:`,
              result.error
            );
            failedCount++;
          }
        } catch (error) {
          console.error(
            `Error sending gold price update to device ${device._id}:`,
            error
          );
          failedCount++;
        }
      }

      const result = {
        sent: sentCount,
        failed: failedCount,
        currentPrice24k,
        currentPrice22k,
        priceChange,
        changeAmount,
        source: goldPriceData.source,
      };

      console.log(
        `Gold price notifications completed: ${sentCount} sent, ${failedCount} failed`
      );
      return result;
    } catch (error) {
      console.error("Error in sendDailyGoldPriceUpdate:", error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Check and send cart abandonment notifications
   */
  async checkCartAbandonment() {
    try {
      console.log(
        `🛒 Checking cart abandonment... [${new Date().toISOString()}]`
      );

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find carts with items but no recent orders
      const abandonedCarts = await Cart.find({
        "items.0": { $exists: true }, // Has items
        updatedAt: {
          $gte: twentyFourHoursAgo,
          $lte: oneHourAgo,
        },
      }).populate("userId");

      const templates = await NotificationTemplate.find({
        templateId: { $in: ["CART_ABANDONMENT_1H", "CART_ABANDONMENT_24H"] },
        status: "active",
      });

      const template1h = templates.find(
        (t) => t.templateId === "CART_ABANDONMENT_1H"
      );
      const template24h = templates.find(
        (t) => t.templateId === "CART_ABANDONMENT_24H"
      );

      let sentCount = 0;
      for (const cart of abandonedCarts) {
        try {
          const timeSinceUpdate = now.getTime() - cart.updatedAt.getTime();
          const hoursAgo = timeSinceUpdate / (1000 * 60 * 60);

          // Check if user has ordered since cart was last updated
          const recentOrder = await Order.findOne({
            userId: cart.userId,
            createdAt: { $gte: cart.updatedAt },
          });

          if (recentOrder) continue; // User has ordered, skip notification

          let template;
          if (hoursAgo >= 23 && hoursAgo < 25 && template24h) {
            template = template24h;
          } else if (hoursAgo >= 1 && hoursAgo < 2 && template1h) {
            template = template1h;
          } else {
            continue; // Not the right time
          }

          const totalValue = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          await NotificationService.sendNotification({
            userId: cart.userId,
            templateId: template._id,
            variables: {
              itemCount: cart.items.length,
              totalValue: totalValue.toFixed(0),
            },
            priority: "normal",
            source: "automated",
          });
          sentCount++;
        } catch (error) {
          console.error(`Error sending cart abandonment notification:`, error);
        }
      }

      console.log(
        `✅ Cart abandonment check completed: ${sentCount} notifications sent [${new Date().toISOString()}]`
      );
    } catch (error) {
      console.error("Error in checkCartAbandonment:", error);
    }
  }

  /**
   * Check for wishlist price drops and notify users
   */
  async checkWishlistPriceDrops() {
    try {
      console.log("Checking wishlist price drops...");

      const template = await NotificationTemplate.findOne({
        templateId: "WISHLIST_PRICE_DROP",
        status: "active",
      });

      if (!template) return;

      // This is a simplified example - you'd need to implement actual price tracking
      const discountedProducts = await Product.find({
        discount: { $gt: 0 },
      });

      let sentCount = 0;
      for (const product of discountedProducts) {
        try {
          // Find users who have this product in their wishlist
          const wishlistEntries = await Wishlist.find({
            productId: product._id,
          });

          for (const wishlistEntry of wishlistEntries) {
            const discountedPrice =
              product.price * (1 - product.discount / 100);
            const savings = product.price - discountedPrice;

            await NotificationService.sendNotification({
              userId: wishlistEntry.userId,
              templateId: template._id,
              variables: {
                productName: product.title,
                newPrice: discountedPrice.toFixed(0),
                savings: savings.toFixed(0),
                productId: product._id.toString(),
              },
              priority: "high",
              source: "automated",
            });
            sentCount++;
          }
        } catch (error) {
          console.error(
            `Error processing price drop for product ${product._id}:`,
            error
          );
        }
      }

      console.log(`Sent ${sentCount} price drop notifications`);
    } catch (error) {
      console.error("Error in checkWishlistPriceDrops:", error);
    }
  }

  /**
   * Check for back in stock items and notify users
   */
  async checkBackInStock() {
    try {
      console.log("Checking back in stock items...");

      const template = await NotificationTemplate.findOne({
        templateId: "BACK_IN_STOCK",
        status: "active",
      });

      if (!template) return;

      // Find recently restocked products
      const recentlyRestocked = await Product.find({
        stocks: { $gt: 0 },
        updatedAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // Last 4 hours
      });

      let sentCount = 0;
      for (const product of recentlyRestocked) {
        try {
          // Find users who have this product in their wishlist
          const wishlistEntries = await Wishlist.find({
            productId: product._id,
          });

          for (const wishlistEntry of wishlistEntries) {
            await NotificationService.sendNotification({
              userId: wishlistEntry.userId,
              templateId: template._id,
              variables: {
                productName: product.title,
                price: product.price.toFixed(0),
                productId: product._id.toString(),
              },
              priority: "high",
              source: "automated",
            });
            sentCount++;
          }
        } catch (error) {
          console.error(
            `Error processing back in stock for product ${product._id}:`,
            error
          );
        }
      }

      console.log(`Sent ${sentCount} back in stock notifications`);
    } catch (error) {
      console.error("Error in checkBackInStock:", error);
    }
  }

  /**
   * Send re-engagement notifications to inactive users
   */
  async sendReEngagementNotifications() {
    try {
      console.log("Sending re-engagement notifications...");

      // Check if notifications can be sent
      if (!this.canSendNotifications()) {
        console.warn(
          "Notification service not ready, skipping re-engagement notifications"
        );
        return;
      }

      const template = await NotificationTemplate.findOne({
        templateId: "RE_ENGAGEMENT",
        status: "active",
      });

      if (!template) return;

      // Find inactive users (no app open in last 14 days)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const inactiveDevices = await UserDevice.find({
        "tokenStatus.isActive": true,
        "preferences.enabled": true,
        "preferences.engagement": true,
        "behavior.lastAppOpen": {
          $gte: fourteenDaysAgo,
          $lte: sevenDaysAgo,
        },
      });

      let sentCount = 0;
      for (const device of inactiveDevices) {
        try {
          await NotificationService.sendNotification({
            userId: device.userId,
            templateId: template._id,
            variables: {},
            priority: "normal",
            source: "automated",
          });
          sentCount++;
        } catch (error) {
          console.error(
            `Error sending re-engagement to user ${device.userId}:`,
            error
          );
        }
      }

      console.log(`Sent ${sentCount} re-engagement notifications`);
    } catch (error) {
      console.error("Error in sendReEngagementNotifications:", error);
    }
  }

  /**
   * Trigger order-related notifications
   */
  async triggerOrderNotification(orderId, notificationType) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        console.warn(`Order ${orderId} not found`);
        return;
      }

      let templateId;
      let variables = {
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        itemCount: order.items.length,
        totalAmount: order.total.toFixed(0),
        orderId: order._id.toString(),
      };

      switch (notificationType) {
        case "confirmed":
          templateId = "ORDER_CONFIRMED";
          variables.estimatedDelivery = "5-7 business days";
          break;
        case "shipped":
          templateId = "ORDER_SHIPPED";
          variables.trackingId = `TRK${order._id
            .toString()
            .slice(-6)
            .toUpperCase()}`;
          break;
        default:
          console.warn(`Unknown notification type: ${notificationType}`);
          return;
      }

      const template = await NotificationTemplate.findOne({
        templateId,
        status: "active",
      });

      if (!template) {
        console.warn(`Template ${templateId} not found`);
        return;
      }

      await NotificationService.sendNotification({
        userId: order.userId,
        templateId: template._id,
        variables,
        priority: "high",
        source: "triggered",
      });

      console.log(`Sent ${notificationType} notification for order ${orderId}`);
    } catch (error) {
      console.error(`Error triggering order notification:`, error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (this.scheduledJobs.size === 0) {
      return; // No jobs to stop
    }

    console.log(`🛑 Stopping ${this.scheduledJobs.size} scheduled jobs...`);
    this.scheduledJobs.forEach((job, name) => {
      try {
        job.destroy();
        console.log(`✅ Stopped job: ${name}`);
      } catch (error) {
        console.warn(`⚠️ Error stopping job ${name}:`, error.message);
      }
    });
    this.scheduledJobs.clear();
    this.isInitialized = false;
    console.log("🛑 All scheduled jobs stopped");
  }
}

module.exports = new AutomatedNotificationService();
