// backend/services/TopicNotificationHelpers.js
const NotificationManager = require('./NotificationManager');
const NotificationTemplate = require('../models/NotificationTemplate');
const { NOTIFICATION_TOPICS, isValidTopic } = require('./../constants/notificationTopics');

/**
 * Helper functions for sending topic-based notifications
 * These are convenience methods for common notification scenarios
 */
class TopicNotificationHelpers {

  /**
   * Send gold price update to all subscribed users (promotional category)
   */
  static async sendGoldPriceUpdate(priceData) {
    try {
      return await NotificationManager.sendNotification({
        type: 'gold_price',
        trigger: 'scheduled',
        data: {
          goldPrice: priceData.goldPrice,
          priceChange: priceData.priceChange,
          changeAmount: priceData.changeAmount,
          priceMessage: priceData.priceMessage,
          deliveryType: 'topic'
        },
        recipients: null, // Not needed for topics
        options: {
          priority: 'normal',
          source: 'automated'
        }
      });
    } catch (error) {
      console.error('Error sending gold price topic notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send new collection launch notification (promotional category)
   */
  static async sendNewCollectionLaunch(collectionData) {
    try {
      return await NotificationManager.sendNotification({
        type: 'new_collection',
        trigger: 'product_launch',
        data: {
          collectionName: collectionData.name,
          itemCount: collectionData.itemCount,
          startingPrice: collectionData.startingPrice,
          collectionSlug: collectionData.slug,
          deliveryType: 'topic'
        },
        recipients: null,
        options: {
          priority: 'normal',
          source: 'admin'
        }
      });
    } catch (error) {
      console.error('Error sending new collection topic notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send festival wishes (seasonal category)
   */
  static async sendFestivalWishes(festivalData) {
    try {
      return await NotificationManager.sendNotification({
        type: 'festival_wishes',
        trigger: 'seasonal',
        data: {
          festivalName: festivalData.name,
          discount: festivalData.discount,
          festivalSlug: festivalData.slug,
          deliveryType: 'topic'
        },
        recipients: null,
        options: {
          priority: 'normal',
          source: 'campaign'
        }
      });
    } catch (error) {
      console.error('Error sending festival wishes topic notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send promotional announcement 
   */
  static async sendPromotionalAnnouncement(promoData) {
    try {
      // Find the promotional template
      const template = await NotificationTemplate.findOne({
        templateId: promoData.templateId || 'PROMOTIONAL_ANNOUNCEMENT',
        status: 'active'
      });

      if (!template) {
        throw new Error('Promotional template not found');
      }

      return await NotificationManager.sendNotification({
        type: 'promotional',
        trigger: 'campaign',
        data: {
          templateId: template._id,
          variables: promoData.variables,
          deliveryType: 'topic'
        },
        recipients: null,
        options: {
          priority: promoData.priority || 'low',
          source: 'campaign'
        }
      });
    } catch (error) {
      console.error('Error sending promotional topic notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send general announcement to all users
   */
  static async sendGeneralAnnouncement(announcementData) {
    try {
      return await NotificationManager.sendNotification({
        type: 'general_announcement',
        trigger: 'admin',
        data: {
          title: announcementData.title,
          message: announcementData.message,
          actionUrl: announcementData.actionUrl,
          deliveryType: 'topic',
          topic: NOTIFICATION_TOPICS.ALL_USERS // Force to all users topic
        },
        recipients: null,
        options: {
          priority: announcementData.priority || 'high',
          source: 'admin'
        }
      });
    } catch (error) {
      console.error('Error sending general announcement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send platform-specific notifications (iOS/Android)
   */
  static async sendPlatformSpecificNotification(platform, notificationData) {
    try {
      const topicMap = {
        'ios': NOTIFICATION_TOPICS.IOS_USERS,
        'android': NOTIFICATION_TOPICS.ANDROID_USERS
      };

      const topic = topicMap[platform.toLowerCase()];
      if (!topic || !isValidTopic(topic)) {
        throw new Error('Invalid platform specified');
      }

      return await NotificationManager.sendNotification({
        type: notificationData.type || 'promotional',
        trigger: 'platform_specific',
        data: {
          ...notificationData.data,
          deliveryType: 'topic',
          topic: topic
        },
        recipients: null,
        options: {
          priority: notificationData.priority || 'normal',
          source: 'admin'
        }
      });
    } catch (error) {
      console.error('Error sending platform-specific notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send to premium customers only
   */
  static async sendPremiumCustomerNotification(notificationData) {
    try {
      return await NotificationManager.sendNotification({
        type: notificationData.type || 'promotional',
        trigger: 'segment_targeted',
        data: {
          ...notificationData.data,
          deliveryType: 'topic',
          topic: 'premium_customers'
        },
        recipients: null,
        options: {
          priority: notificationData.priority || 'normal',
          source: 'campaign'
        }
      });
    } catch (error) {
      console.error('Error sending premium customer notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch send multiple topic notifications
   */
  static async sendBatchTopicNotifications(notifications) {
    const results = [];

    for (const notification of notifications) {
      try {
        const result = await NotificationManager.sendNotification({
          type: notification.type,
          trigger: notification.trigger || 'batch',
          data: {
            ...notification.data,
            deliveryType: 'topic'
          },
          recipients: null,
          options: {
            priority: notification.priority || 'normal',
            source: 'batch',
            delay: notification.delay || 0
          }
        });

        results.push({
          success: result.success,
          type: notification.type,
          result
        });

        // Add delay between notifications if specified
        if (notification.delay) {
          await new Promise(resolve => setTimeout(resolve, notification.delay));
        }

      } catch (error) {
        results.push({
          success: false,
          type: notification.type,
          error: error.message
        });
      }
    }

    return {
      success: true,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = TopicNotificationHelpers;