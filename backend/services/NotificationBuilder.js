// backend/services/NotificationBuilder.js
const NotificationTemplate = require('../models/NotificationTemplate');
const Order = require('../models/Order');
const User = require('../models/User');
const UserDevice = require('../models/UserDevice');
const Cart = require('../models/Cart');
const { NOTIFICATION_TOPICS, isValidTopic, getTopicForCategory } = require('../constants/notificationTopics');

/**
 * NotificationBuilder - Handles template resolution, variable interpolation, and user targeting
 * 
 * This service is responsible for:
 * 1. Resolving the correct notification template based on request type
 * 2. Interpolating variables into template content
 * 3. Determining target users based on recipients criteria
 * 4. Building ready-to-send notification objects
 */
class NotificationBuilder {
  constructor() {
    this.isInitialized = false;
    this.templateCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the builder
   */
  async initialize() {
    if (this.isInitialized) return { success: true };

    try {
      console.log('🔧 Initializing Notification Builder...');
      
      // Pre-load critical templates
      await this._preloadTemplates();
      
      this.isInitialized = true;
      console.log('✅ Notification Builder initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize Notification Builder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build notification from request
   */
  async buildNotification(request) {
    try {
      const { type, trigger, data, recipients, requestId } = request;

      // Step 1: Resolve template
      const template = await this._resolveTemplate(type, trigger, data);
      if (!template) {
        return {
          success: false,
          error: `No template found for type: ${type}, trigger: ${trigger}`
        };
      }

      // Step 2: Check if this should use topic-based delivery
      if (this._shouldUseTopicDelivery(type, trigger, data)) {
        return await this._buildTopicNotification(type, data, template, request);
      }

      // Step 3: Resolve target users (for individual notifications)
      const targetUsers = await this._resolveTargetUsers(recipients, data);
      if (!targetUsers || targetUsers.length === 0) {
        return {
          success: false,
          error: 'No target users found'
        };
      }

      // Step 4: Build variables for each user
      const notifications = [];
      for (const user of targetUsers) {
        try {
          const variables = await this._buildVariables(type, data, user, template);
          const content = this._interpolateTemplate(template, variables);

          notifications.push({
            userId: user._id,
            templateId: template._id,
            content,
            variables,
            priority: request.options?.priority || 'normal',
            userDevices: user.devices || [],
            deliveryType: 'individual'
          });
        } catch (userError) {
          console.warn(`Failed to build notification for user ${user._id}:`, userError.message);
          // Continue with other users
        }
      }

      return {
        success: true,
        notifications,
        metadata: {
          templateId: template._id,
          templateName: template.name,
          targetUserCount: targetUsers.length,
          successfulBuilds: notifications.length,
          buildErrors: targetUsers.length - notifications.length,
          deliveryType: 'individual'
        }
      };

    } catch (error) {
      console.error('Error in buildNotification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build topic-based notification
   * @private
   */
  async _buildTopicNotification(type, data, template, request) {
    try {
      // Resolve the Firebase topic
      const topic = this._resolveNotificationTopic(type, data);
      
      // Build variables (no user-specific data)
      const variables = await this._buildTopicVariables(type, data, template);
      const content = this._interpolateTemplate(template, variables);

      const notification = {
        templateId: template._id,
        content,
        variables,
        priority: request.options?.priority || 'normal',
        deliveryType: 'topic',
        topic: topic
      };

      return {
        success: true,
        notifications: [notification],
        metadata: {
          templateId: template._id,
          templateName: template.name,
          deliveryType: 'topic',
          topic: topic,
          targetUserCount: 'broadcast',
          successfulBuilds: 1,
          buildErrors: 0
        }
      };

    } catch (error) {
      console.error('Error building topic notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build variables for topic-based notifications (no user-specific data)
   * @private
   */
  async _buildTopicVariables(type, data, template) {
    const baseVariables = {
      customerName: 'Valued Customer', // Generic greeting for broadcasts
    };

    switch (type) {
      case 'gold_price':
        return {
          ...baseVariables,
          goldPrice: data.goldPrice || '0',
          priceChange: data.priceChange || 'unchanged',
          changeAmount: data.changeAmount || '0',
          priceMessage: data.priceMessage || 'Check latest gold prices'
        };

      case 'new_collection':
        return {
          ...baseVariables,
          collectionName: data.collectionName || 'New Collection',
          itemCount: data.itemCount || '0',
          startingPrice: data.startingPrice || '0',
          collectionSlug: data.collectionSlug || 'new-collection'
        };

      case 'festival_wishes':
      case 'seasonal':
        return {
          ...baseVariables,
          festivalName: data.festivalName || 'Festival',
          discount: data.discount || '10',
          festivalSlug: data.festivalSlug || 'festival-sale'
        };

      case 'promotional':
        return { ...baseVariables, ...data.variables };

      case 'engagement':
        return {
          ...baseVariables,
          ...data.variables
        };

      default:
        return baseVariables;
    }
  }

  /**
   * Check if notification type should use topic-based delivery
   */
  _shouldUseTopicDelivery(type, trigger, data) {
    // Topic-based types map to our category preferences
    const topicBasedTypes = [
      'gold_price',        // → promotional topic
      'promotional',       // → promotional topic
      'new_collection',    // → promotional topic  
      'festival_wishes',   // → seasonal topic
      'seasonal',          // → seasonal topic
      'engagement',        // → engagement topic
      'general_announcement' // → all_users topic
    ];

    // Also check if explicitly specified as topic delivery
    if (data.deliveryType === 'topic') {
      return true;
    }

    return topicBasedTypes.includes(type);
  }

  /**
   * Resolve Firebase topic for topic-based notifications
   */
  _resolveNotificationTopic(type, data) {
    const topicMap = {
      'gold_price': NOTIFICATION_TOPICS.PROMOTIONAL, // Gold price updates are promotional in nature
      'promotional': NOTIFICATION_TOPICS.PROMOTIONAL,
      'new_collection': NOTIFICATION_TOPICS.PROMOTIONAL, // New collections are promotional
      'festival_wishes': NOTIFICATION_TOPICS.SEASONAL,
      'seasonal': NOTIFICATION_TOPICS.SEASONAL,
      'general_announcement': NOTIFICATION_TOPICS.ALL_USERS,
      'engagement': NOTIFICATION_TOPICS.ENGAGEMENT
    };

    // Allow override from data if valid
    if (data.topic && isValidTopic(data.topic)) {
      return data.topic;
    }

    const resolvedTopic = topicMap[type] || NOTIFICATION_TOPICS.ALL_USERS;
    
    // Validate resolved topic
    if (!isValidTopic(resolvedTopic)) {
      console.warn(`Invalid topic resolved: ${resolvedTopic}, falling back to ALL_USERS`);
      return NOTIFICATION_TOPICS.ALL_USERS;
    }

    return resolvedTopic;
  }

  /**
   * Resolve notification template based on type and context
   * @private
   */
  async _resolveTemplate(type, trigger, data) {
    try {
      let templateId;

      switch (type) {
        case 'order_status':
          templateId = this._getOrderStatusTemplate(data.status);
          break;
          
        case 'cart_event':
          templateId = this._getCartEventTemplate(data.event);
          break;
          
        case 'promotional':
          templateId = data.templateId;
          break;
          
        case 'price_alert':
          templateId = 'WISHLIST_PRICE_DROP';
          break;
          
        case 'stock_alert':
          templateId = 'BACK_IN_STOCK';
          break;
          
        case 'gold_price':
          templateId = 'DAILY_GOLD_PRICE';
          break;

        case 'new_collection':
          templateId = 'NEW_COLLECTION_LAUNCH';
          break;

        case 'festival_wishes':
        case 'seasonal':
          templateId = 'FESTIVAL_WISHES';
          break;
          
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      return await this._getTemplate(templateId);
    } catch (error) {
      console.error('Error resolving template:', error);
      return null;
    }
  }

  /**
   * Get order status template ID
   * @private
   */
  _getOrderStatusTemplate(status) {
    const statusMap = {
      'processing': 'ORDER_PROCESSING',
      'confirmed': 'ORDER_PROCESSING',
      'shipped': 'ORDER_SHIPPED',
      'delivered': 'ORDER_DELIVERED',
      'payment_failed': 'ORDER_PAYMENT_FAILED',
      'cancelled': 'ORDER_CANCELLED'
    };

    return statusMap[status.toLowerCase()] || 'ORDER_STATUS_UPDATE';
  }

  /**
   * Get cart event template ID
   * @private
   */
  _getCartEventTemplate(event) {
    const eventMap = {
      'abandonment_1h': 'CART_ABANDONMENT_1H',
      'abandonment_24h': 'CART_ABANDONMENT_24H',
      'checkout_reminder': 'CART_CHECKOUT_REMINDER'
    };

    return eventMap[event] || 'CART_ABANDONMENT_1H';
  }

  /**
   * Get template with caching
   * @private
   */
  async _getTemplate(templateId) {
    // Check cache first
    const cached = this.templateCache.get(templateId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.template;
    }

    // Fetch from database
    const template = await NotificationTemplate.findOne({
      templateId,
      status: 'active'
    });

    if (template) {
      this.templateCache.set(templateId, {
        template,
        timestamp: Date.now()
      });
    }

    return template;
  }

  /**
   * Resolve target users based on recipients criteria
   * @private
   */
  async _resolveTargetUsers(recipients, data) {
    try {
      let userIds = [];

      if (typeof recipients === 'string') {
        // Single user ID
        userIds = [recipients];
      } else if (Array.isArray(recipients)) {
        // Array of user IDs
        userIds = recipients;
      } else if (typeof recipients === 'object') {
        // Targeting criteria object
        userIds = await this._resolveUsersByTargeting(recipients);
      } else if (data.orderId) {
        // Resolve from order
        const order = await Order.findById(data.orderId);
        if (order && order.userId) {
          userIds = [order.userId];
        }
      } else if (data.userId) {
        // Direct user ID in data
        userIds = [data.userId];
      }

      if (userIds.length === 0) {
        return [];
      }

      // Get users with their active devices
      const users = await User.aggregate([
        { $match: { _id: { $in: userIds.map(id => typeof id === 'string' ? id : id.toString()) } } },
        {
          $lookup: {
            from: 'userdevices',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  'tokenStatus.isActive': true,
                  'preferences.enabled': true
                }
              }
            ],
            as: 'devices'
          }
        },
        {
          $match: { 'devices.0': { $exists: true } } // Only users with active devices
        }
      ]);

      return users;
    } catch (error) {
      console.error('Error resolving target users:', error);
      return [];
    }
  }

  /**
   * Resolve users by targeting criteria
   * @private
   */
  async _resolveUsersByTargeting(targeting) {
    // This would implement complex targeting logic
    // For now, return empty array
    console.warn('Complex targeting not implemented yet');
    return [];
  }

  /**
   * Build variables for template interpolation
   * @private
   */
  async _buildVariables(type, data, user, template) {
    const baseVariables = {
      customerName: user.name || user.displayName || 'Valued Customer',
      userId: user._id.toString()
    };

    switch (type) {
      case 'order_status':
        return await this._buildOrderVariables(data, user, baseVariables);
        
      case 'cart_event':
        return await this._buildCartVariables(data, user, baseVariables);
        
      case 'promotional':
        return { ...baseVariables, ...data.variables };
        
      default:
        return baseVariables;
    }
  }

  /**
   * Build order-specific variables
   * @private
   */
  async _buildOrderVariables(data, user, baseVariables) {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    return {
      ...baseVariables,
      orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
      orderId: order._id.toString(),
      orderTotal: order.total || order.totalAmount || 0,
      currency: '₹',
      itemCount: order.items?.length || 0,
      estimatedDelivery: order.estimatedDelivery || '5-7 business days',
      trackingNumber: order.trackingNumber || `TRK${order._id.toString().slice(-6).toUpperCase()}`,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toLocaleDateString() : new Date().toLocaleDateString(),
      deliveredTo: order.deliveryAddress?.name || user.name || 'Customer',
      errorMessage: data.errorMessage || 'Payment processing failed. Please try again.'
    };
  }

  /**
   * Build cart-specific variables
   * @private
   */
  async _buildCartVariables(data, user, baseVariables) {
    const cart = await Cart.findOne({ userId: user._id });
    
    return {
      ...baseVariables,
      itemCount: cart?.items?.length || 0,
      totalValue: cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
      currency: '₹'
    };
  }

  /**
   * Interpolate template with variables
   * @private
   */
  _interpolateTemplate(template, variables) {
    let title = template.title;
    let body = template.body;

    // Simple variable interpolation
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    // Process action URLs
    let action = null;
    if (template.action) {
      action = {
        ...template.action,
        value: this._interpolateString(template.action.value, variables)
      };
    }

    return {
      title,
      body,
      action,
      imageUrl: template.imageUrl,
      iconUrl: template.iconUrl
    };
  }

  /**
   * Interpolate string with variables
   * @private
   */
  _interpolateString(str, variables) {
    if (!str) return str;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      str = str.replace(regex, variables[key]);
    });
    
    return str;
  }

  /**
   * Pre-load critical templates into cache
   * @private
   */
  async _preloadTemplates() {
    const criticalTemplates = [
      'ORDER_PROCESSING',
      'ORDER_SHIPPED', 
      'ORDER_DELIVERED',
      'ORDER_PAYMENT_FAILED',
      'CART_ABANDONMENT_1H'
    ];

    for (const templateId of criticalTemplates) {
      try {
        await this._getTemplate(templateId);
      } catch (error) {
        console.warn(`Failed to preload template ${templateId}:`, error.message);
      }
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.templateCache.size,
      cacheExpiry: this.cacheExpiry
    };
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    console.log('📝 Template cache cleared');
  }
}

// Export singleton instance
module.exports = new NotificationBuilder();