// backend/models/TopicNotificationLog.js
const mongoose = require('mongoose');

/**
 * Lightweight logging for topic-based notifications
 * Since topic notifications go to potentially anonymous subscribers,
 * we don't track individual user deliveries but maintain high-level metrics
 */
const topicNotificationLogSchema = new mongoose.Schema({
  // Unique identifier for this topic delivery
  notificationId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Campaign/batch identification (optional)
  campaignId: {
    type: String,
    index: true
  },
  
  // Template information
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
  
  // Topic details
  topic: {
    type: String,
    required: true,
    index: true
  },
  
  // Notification content (for audit purposes)
  content: {
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: String,
    variables: mongoose.Schema.Types.Mixed
  },
  
  // Delivery information
  delivery: {
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
      index: true
    },
    sentAt: Date,
    failedAt: Date,
    fcmMessageId: String,
    failureReason: String,
    errorCode: String
  },
  
  // Context information
  source: {
    type: String,
    enum: ['manual', 'automated', 'campaign', 'scheduled', 'api', 'admin'],
    default: 'automated',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  
  // Performance metrics
  performance: {
    processingTime: Number // Time in milliseconds
  },
  
  // Firebase topic subscriber estimate (if available)
  // Note: Firebase doesn't provide exact subscriber counts for privacy
  estimatedReach: {
    type: String,
    default: 'unknown'
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
topicNotificationLogSchema.index({ topic: 1, createdAt: -1 });
topicNotificationLogSchema.index({ templateId: 1, createdAt: -1 });
topicNotificationLogSchema.index({ source: 1, createdAt: -1 });
topicNotificationLogSchema.index({ 'delivery.status': 1, createdAt: -1 });

// TTL index to automatically clean up old logs (keep for 90 days)
topicNotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual for delivery time
topicNotificationLogSchema.virtual('deliveredAt').get(function() {
  return this.delivery.sentAt || this.delivery.failedAt;
});

// Method to get topic statistics
topicNotificationLogSchema.statics.getTopicStats = async function(topic, dateRange = {}) {
  const match = { topic };
  
  if (dateRange.from || dateRange.to) {
    match.createdAt = {};
    if (dateRange.from) match.createdAt.$gte = new Date(dateRange.from);
    if (dateRange.to) match.createdAt.$lte = new Date(dateRange.to);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSent: { 
          $sum: { 
            $cond: [{ $eq: ['$delivery.status', 'sent'] }, 1, 0] 
          } 
        },
        totalFailed: { 
          $sum: { 
            $cond: [{ $eq: ['$delivery.status', 'failed'] }, 1, 0] 
          } 
        },
        avgProcessingTime: { $avg: '$performance.processingTime' },
        lastSent: { $max: '$delivery.sentAt' }
      }
    }
  ]);
  
  return stats[0] || { 
    totalSent: 0, 
    totalFailed: 0, 
    avgProcessingTime: 0, 
    lastSent: null 
  };
};

// Method to get template usage in topics
topicNotificationLogSchema.statics.getTemplateTopicUsage = async function(templateId, dateRange = {}) {
  const match = { templateId: new mongoose.Types.ObjectId(templateId) };
  
  if (dateRange.from || dateRange.to) {
    match.createdAt = {};
    if (dateRange.from) match.createdAt.$gte = new Date(dateRange.from);
    if (dateRange.to) match.createdAt.$lte = new Date(dateRange.to);
  }
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$topic',
        count: { $sum: 1 },
        lastUsed: { $max: '$createdAt' },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$delivery.status', 'sent'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('TopicNotificationLog', topicNotificationLogSchema);