// backend/models/NotificationLog.js
const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  // Unique identifier for tracking
  notificationId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Campaign/batch identification
  campaignId: {
    type: String,
    index: true
  },
  
  batchId: {
    type: String,
    index: true
  },
  
  // Template and content information
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
    required: true,
    index: true
  },
  
  templateVersion: {
    type: Number,
    default: 1
  },
  
  // A/B testing variant (if applicable)
  abVariant: String,
  
  // Target user and device
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserDevice',
    required: true,
    index: true
  },
  
  fcmToken: String, // Stored for debugging purposes
  
  // Notification content (as sent)
  content: {
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: String,
    iconUrl: String,
    data: mongoose.Schema.Types.Mixed // Custom data payload
  },
  
  // Delivery information
  delivery: {
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'expired'],
      default: 'pending',
      index: true
    },
    
    sentAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    
    // FCM response details
    fcmMessageId: String,
    fcmResponse: mongoose.Schema.Types.Mixed,
    
    // Failure information
    failureReason: String,
    errorCode: String,
    retryCount: { type: Number, default: 0 },
    nextRetryAt: Date
  },
  
  // User interaction tracking
  interaction: {
    opened: { type: Boolean, default: false },
    openedAt: Date,
    
    clicked: { type: Boolean, default: false },
    clickedAt: Date,
    
    dismissed: { type: Boolean, default: false },
    dismissedAt: Date,
    
    // Custom conversion events
    converted: { type: Boolean, default: false },
    convertedAt: Date,
    conversionValue: Number,
    conversionEvents: [String]
  },
  
  // Targeting information
  targeting: {
    userSegment: String,
    userTags: [String],
    location: {
      country: String,
      state: String,
      city: String
    },
    customFilters: mongoose.Schema.Types.Mixed
  },
  
  // Personalization data
  personalization: {
    variables: mongoose.Schema.Types.Mixed,
    personalizedContent: {
      title: String,
      body: String
    }
  },
  
  // Scheduling information
  scheduling: {
    scheduledFor: Date,
    actualSentAt: Date,
    delay: Number, // in milliseconds
    timezone: String
  },
  
  // Performance metrics
  performance: {
    processingTime: Number, // Time to process and send (ms)
    deliveryTime: Number,   // Time from send to delivery (ms)
    timeToOpen: Number,     // Time from delivery to open (ms)
    timeToClick: Number     // Time from open to click (ms)
  },
  
  // Context and metadata
  context: {
    channel: {
      type: String,
      enum: ['fcm', 'apns', 'web_push'],
      default: 'fcm'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    source: {
      type: String,
      enum: ['manual', 'automated', 'triggered', 'scheduled'],
      required: true
    },
    triggeredBy: String, // Event or condition that triggered the notification
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
  },
  
  // Compliance and privacy
  compliance: {
    consentGiven: { type: Boolean, default: true },
    consentTimestamp: Date,
    dataRetentionExpiry: Date,
    gdprCompliant: { type: Boolean, default: true }
  }
  
}, { 
  timestamps: true,
  // Auto-delete logs after 90 days for GDPR compliance
  expires: 7776000 // 90 days in seconds
});

// Compound indexes for efficient queries
notificationLogSchema.index({ userId: 1, createdAt: -1 });
notificationLogSchema.index({ campaignId: 1, createdAt: -1 });
notificationLogSchema.index({ 'delivery.status': 1, createdAt: -1 });
notificationLogSchema.index({ templateId: 1, createdAt: -1 });
notificationLogSchema.index({ 'delivery.nextRetryAt': 1 }, { sparse: true });

// Index for analytics queries
notificationLogSchema.index({ 
  'delivery.status': 1, 
  'interaction.opened': 1, 
  'interaction.clicked': 1, 
  createdAt: -1 
});

// Geospatial index for location-based analytics
notificationLogSchema.index({ 'targeting.location': 1 });

// Methods for updating interaction events
notificationLogSchema.methods.markAsOpened = function() {
  if (!this.interaction.opened) {
    this.interaction.opened = true;
    this.interaction.openedAt = new Date();
    
    // Calculate time to open
    if (this.delivery.deliveredAt) {
      this.performance.timeToOpen = this.interaction.openedAt - this.delivery.deliveredAt;
    }
  }
};

notificationLogSchema.methods.markAsClicked = function() {
  // Automatically mark as opened if not already
  if (!this.interaction.opened) {
    this.markAsOpened();
  }
  
  if (!this.interaction.clicked) {
    this.interaction.clicked = true;
    this.interaction.clickedAt = new Date();
    
    // Calculate time to click
    if (this.interaction.openedAt) {
      this.performance.timeToClick = this.interaction.clickedAt - this.interaction.openedAt;
    }
  }
};

notificationLogSchema.methods.markAsDismissed = function() {
  if (!this.interaction.dismissed) {
    this.interaction.dismissed = true;
    this.interaction.dismissedAt = new Date();
  }
};

notificationLogSchema.methods.markAsConverted = function(conversionValue = null, events = []) {
  if (!this.interaction.converted) {
    this.interaction.converted = true;
    this.interaction.convertedAt = new Date();
    
    if (conversionValue !== null) {
      this.interaction.conversionValue = conversionValue;
    }
    
    if (events.length > 0) {
      this.interaction.conversionEvents = events;
    }
  }
};

// Static methods for analytics
notificationLogSchema.statics.getDeliveryStats = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSent: { $sum: { $cond: [{ $ne: ['$delivery.status', 'pending'] }, 1, 0] } },
        totalDelivered: { $sum: { $cond: [{ $eq: ['$delivery.status', 'delivered'] }, 1, 0] } },
        totalFailed: { $sum: { $cond: [{ $eq: ['$delivery.status', 'failed'] }, 1, 0] } },
        totalOpened: { $sum: { $cond: ['$interaction.opened', 1, 0] } },
        totalClicked: { $sum: { $cond: ['$interaction.clicked', 1, 0] } },
        totalConverted: { $sum: { $cond: ['$interaction.converted', 1, 0] } },
        avgTimeToOpen: { $avg: '$performance.timeToOpen' },
        avgTimeToClick: { $avg: '$performance.timeToClick' }
      }
    }
  ]);
};

notificationLogSchema.statics.getCampaignStats = function(campaignId) {
  return this.getDeliveryStats({ campaignId });
};

notificationLogSchema.statics.getTemplateStats = function(templateId) {
  return this.getDeliveryStats({ templateId });
};

notificationLogSchema.statics.getUserEngagement = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.getDeliveryStats({ 
    userId, 
    createdAt: { $gte: startDate } 
  });
};

module.exports = mongoose.model('NotificationLog', notificationLogSchema);