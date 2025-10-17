// backend/constants/notificationTopics.js

/**
 * Centralized notification topic definitions
 * These topics must match between backend and frontend
 */

const NOTIFICATION_TOPICS = {
  // Core category topics (based on UserDevice preferences)
  ALL_USERS: 'all_users',
  PROMOTIONAL: 'promotional',
  SEASONAL: 'seasonal',
  ENGAGEMENT: 'engagement',
  
  // User segment topics  
  PREMIUM_CUSTOMERS: 'premium_customers',
  ACTIVE_USERS: 'active_users',
  NEW_USERS: 'new_users',
  
  // Platform topics
  ANDROID_USERS: 'android_users',
  IOS_USERS: 'ios_users'
};

/**
 * Topic validation - ensures only predefined topics are used
 */
const VALID_TOPICS = Object.values(NOTIFICATION_TOPICS);

/**
 * Mapping of notification categories to Firebase topics
 */
const CATEGORY_TO_TOPIC_MAPPING = {
  promotional: NOTIFICATION_TOPICS.PROMOTIONAL,
  seasonal: NOTIFICATION_TOPICS.SEASONAL,
  engagement: NOTIFICATION_TOPICS.ENGAGEMENT,
  // Note: transactional and userSpecific are NOT topic-based (individual delivery only)
};

/**
 * Mapping of notification types to topics
 */
const TYPE_TO_TOPIC_MAPPING = {
  gold_price: NOTIFICATION_TOPICS.PROMOTIONAL,
  promotional: NOTIFICATION_TOPICS.PROMOTIONAL,
  new_collection: NOTIFICATION_TOPICS.PROMOTIONAL,
  festival_wishes: NOTIFICATION_TOPICS.SEASONAL,
  seasonal: NOTIFICATION_TOPICS.SEASONAL,
  engagement: NOTIFICATION_TOPICS.ENGAGEMENT,
  re_engagement: NOTIFICATION_TOPICS.ENGAGEMENT,
  general_announcement: NOTIFICATION_TOPICS.ALL_USERS
};

/**
 * Categories that support topic-based notifications
 */
const TOPIC_BASED_CATEGORIES = ['promotional', 'seasonal', 'engagement'];

/**
 * Categories that require individual delivery (not topic-based)
 */
const INDIVIDUAL_DELIVERY_CATEGORIES = ['transactional', 'userSpecific'];

/**
 * Validate if a topic is valid
 */
function isValidTopic(topic) {
  return VALID_TOPICS.includes(topic);
}

/**
 * Get topic for a notification category
 */
function getTopicForCategory(category) {
  return CATEGORY_TO_TOPIC_MAPPING[category] || null;
}

/**
 * Get topic for a notification type
 */
function getTopicForType(type) {
  return TYPE_TO_TOPIC_MAPPING[type] || NOTIFICATION_TOPICS.ALL_USERS;
}

/**
 * Check if category supports topic-based delivery
 */
function isCategoryTopicBased(category) {
  return TOPIC_BASED_CATEGORIES.includes(category);
}

/**
 * Get all topics that should be subscribed based on user preferences
 */
function getTopicsForPreferences(preferences, userSegment = null, platform = null) {
  const topics = [];
  
  // Always subscribe to all users
  topics.push(NOTIFICATION_TOPICS.ALL_USERS);
  
  // Platform-specific topic
  if (platform === 'ios') {
    topics.push(NOTIFICATION_TOPICS.IOS_USERS);
  } else if (platform === 'android') {
    topics.push(NOTIFICATION_TOPICS.ANDROID_USERS);
  }
  
  // Category-based topics
  if (preferences.promotional) {
    topics.push(NOTIFICATION_TOPICS.PROMOTIONAL);
  }
  
  if (preferences.seasonal) {
    topics.push(NOTIFICATION_TOPICS.SEASONAL);
  }
  
  if (preferences.engagement) {
    topics.push(NOTIFICATION_TOPICS.ENGAGEMENT);
  }
  
  // User segment topics
  if (userSegment === 'premium_customer') {
    topics.push(NOTIFICATION_TOPICS.PREMIUM_CUSTOMERS);
  }
  
  if (['active_user', 'loyal_customer', 'premium_customer'].includes(userSegment)) {
    topics.push(NOTIFICATION_TOPICS.ACTIVE_USERS);
  }
  
  if (userSegment === 'new_user') {
    topics.push(NOTIFICATION_TOPICS.NEW_USERS);
  }
  
  return topics;
}

/**
 * Topic descriptions for frontend display
 */
const TOPIC_DESCRIPTIONS = {
  [NOTIFICATION_TOPICS.ALL_USERS]: 'General announcements and important updates',
  [NOTIFICATION_TOPICS.PROMOTIONAL]: 'Promotional offers, gold prices, and new collections',
  [NOTIFICATION_TOPICS.SEASONAL]: 'Festival wishes and seasonal offers',
  [NOTIFICATION_TOPICS.ENGAGEMENT]: 'Re-engagement campaigns and activity reminders',
  [NOTIFICATION_TOPICS.PREMIUM_CUSTOMERS]: 'Exclusive offers for premium customers',
  [NOTIFICATION_TOPICS.ACTIVE_USERS]: 'Updates and offers for active users',
  [NOTIFICATION_TOPICS.NEW_USERS]: 'Welcome messages and onboarding notifications',
  [NOTIFICATION_TOPICS.ANDROID_USERS]: 'Android-specific notifications and updates',
  [NOTIFICATION_TOPICS.IOS_USERS]: 'iOS-specific notifications and updates'
};

module.exports = {
  NOTIFICATION_TOPICS,
  VALID_TOPICS,
  CATEGORY_TO_TOPIC_MAPPING,
  TYPE_TO_TOPIC_MAPPING,
  TOPIC_BASED_CATEGORIES,
  INDIVIDUAL_DELIVERY_CATEGORIES,
  TOPIC_DESCRIPTIONS,
  
  // Utility functions
  isValidTopic,
  getTopicForCategory,
  getTopicForType,
  isCategoryTopicBased,
  getTopicsForPreferences
};