// backend/models/NotificationCampaign.js
const mongoose = require('mongoose');

const notificationCampaignSchema = new mongoose.Schema({
  // Campaign identification
  campaignId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: String,
  
  // Campaign type and category
  type: {
    type: String,
    enum: [
      'one_time',        // Single broadcast campaign
      'scheduled',       // Scheduled for future
      'recurring',       // Recurring campaigns (daily, weekly, etc.)
      'triggered',       // Event-triggered campaigns
      'drip',           // Drip campaigns with multiple notifications
      'ab_test'         // A/B testing campaigns
    ],
    required: true
  },
  
  category: {
    type: String,
    enum: [
      'promotional',     // Sales, offers, new collections
      'engagement',      // Re-engagement, recommendations
      'transactional',   // Order updates, payment confirmations
      'seasonal',        // Festival wishes, seasonal offers
      'behavioral',      // Cart abandonment, price drops
      'informational'    // Gold prices, news, updates
    ],
    required: true
  },
  
  // Template configuration
  template: {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      required: true
    },
    
    // Template variables for this campaign
    variables: mongoose.Schema.Types.Mixed,
    
    // A/B test variants (if applicable)
    variants: [{
      name: String,
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NotificationTemplate'
      },
      variables: mongoose.Schema.Types.Mixed,
      trafficAllocation: { type: Number, default: 50 } // Percentage
    }]
  },
  
  // Audience targeting
  targeting: {
    // Predefined segments
    segments: [{
      type: String,
      enum: [
        'all_users',
        'new_users',
        'active_users',
        'inactive_users',
        'premium_customers',
        'cart_abandoners',
        'wishlist_users',
        'recent_browsers',
        'high_spenders',
        'loyalty_members'
      ]
    }],
    
    // Custom user tags
    tags: {
      include: [String],
      exclude: [String]
    },
    
    // Behavioral filters
    behavior: {
      lastAppOpen: {
        min: Number, // Days ago
        max: Number  // Days ago
      },
      totalPurchases: {
        min: Number,
        max: Number
      },
      totalSpent: {
        min: Number,
        max: Number
      },
      cartValue: {
        min: Number,
        max: Number
      },
      favoriteCategories: [String]
    },
    
    // Geographic targeting
    location: {
      countries: [String],
      states: [String],
      cities: [String],
      radius: {
        coordinates: [Number], // [longitude, latitude]
        distance: Number,      // in kilometers
        unit: { type: String, default: 'km' }
      }
    },
    
    // Device and platform filters
    device: {
      platforms: [{
        type: String,
        enum: ['ios', 'android', 'web']
      }],
      appVersions: [String],
      languages: [String],
      timezones: [String]
    },
    
    // Advanced custom filters
    customFilters: mongoose.Schema.Types.Mixed,
    
    // Estimated audience size
    estimatedSize: Number,
    actualSize: Number
  },
  
  // Scheduling configuration
  scheduling: {
    // Immediate or scheduled
    sendType: {
      type: String,
      enum: ['immediate', 'scheduled', 'optimal'],
      default: 'immediate'
    },
    
    // For scheduled campaigns
    scheduledAt: Date,
    timezone: { type: String, default: 'Asia/Kolkata' },
    
    // For recurring campaigns
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom']
      },
      interval: Number,    // For custom frequency
      daysOfWeek: [Number], // 0-6 for weekly
      timeOfDay: String,    // "HH:MM" format
      endDate: Date
    },
    
    // Send optimization
    optimization: {
      enabled: { type: Boolean, default: false },
      strategy: {
        type: String,
        enum: ['send_time', 'user_timezone', 'engagement_history']
      }
    }
  },
  
  // Delivery configuration
  delivery: {
    // Rate limiting
    rateLimit: {
      maxPerSecond: { type: Number, default: 100 },
      batchSize: { type: Number, default: 1000 }
    },
    
    // Retry configuration
    retry: {
      enabled: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 3 },
      backoffStrategy: {
        type: String,
        enum: ['linear', 'exponential'],
        default: 'exponential'
      },
      initialDelay: { type: Number, default: 300 }, // seconds
      maxDelay: { type: Number, default: 3600 }     // seconds
    },
    
    // Priority settings
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  },
  
  // Campaign status and lifecycle
  status: {
    type: String,
    enum: [
      'draft',        // Being created
      'scheduled',    // Scheduled for future
      'running',      // Currently sending
      'paused',       // Temporarily paused
      'completed',    // Finished sending
      'cancelled',    // Cancelled before completion
      'failed'        // Failed to execute
    ],
    default: 'draft',
    index: true
  },
  
  // Execution tracking
  execution: {
    startedAt: Date,
    completedAt: Date,
    pausedAt: Date,
    
    // Progress tracking
    progress: {
      totalTargeted: { type: Number, default: 0 },
      processed: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      
      // Current batch information
      currentBatch: String,
      lastProcessedAt: Date
    },
    
    // Error tracking
    errors: [{
      timestamp: Date,
      errorType: String,
      errorMessage: String,
      affectedCount: Number
    }]
  },
  
  // Campaign analytics and performance
  analytics: {
    // Delivery metrics
    delivery: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      deliveryRate: { type: Number, default: 0 }
    },
    
    // Engagement metrics
    engagement: {
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      dismissed: { type: Number, default: 0 },
      openRate: { type: Number, default: 0 },
      clickRate: { type: Number, default: 0 },
      dismissalRate: { type: Number, default: 0 }
    },
    
    // Conversion metrics
    conversion: {
      converted: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 }
    },
    
    // Performance metrics
    performance: {
      avgDeliveryTime: Number,  // milliseconds
      avgTimeToOpen: Number,    // milliseconds
      avgTimeToClick: Number,   // milliseconds
      peakDeliveryRate: Number, // notifications per second
      totalCost: Number
    },
    
    // Time-series data for charts
    timeSeries: [{
      timestamp: Date,
      sent: Number,
      delivered: Number,
      opened: Number,
      clicked: Number
    }]
  },
  
  // Budget and cost tracking
  budget: {
    allocated: Number,
    spent: Number,
    costPerNotification: Number,
    currency: { type: String, default: 'INR' }
  },
  
  // Compliance and approvals
  compliance: {
    approved: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    
    // Regulatory compliance
    gdprCompliant: { type: Boolean, default: true },
    consentRequired: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 90 }
  },
  
  // Campaign management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags for organization
  tags: [String]
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
notificationCampaignSchema.index({ status: 1, createdAt: -1 });
notificationCampaignSchema.index({ type: 1, category: 1 });
notificationCampaignSchema.index({ 'scheduling.scheduledAt': 1 });
notificationCampaignSchema.index({ createdBy: 1, createdAt: -1 });
notificationCampaignSchema.index({ tags: 1 });

// Virtual for completion percentage
notificationCampaignSchema.virtual('completionPercentage').get(function() {
  if (this.execution.progress.totalTargeted === 0) return 0;
  return Math.round((this.execution.progress.processed / this.execution.progress.totalTargeted) * 100);
});

// Virtual for overall performance score
notificationCampaignSchema.virtual('performanceScore').get(function() {
  const deliveryRate = this.analytics.delivery.deliveryRate || 0;
  const openRate = this.analytics.engagement.openRate || 0;
  const clickRate = this.analytics.engagement.clickRate || 0;
  
  // Weighted score: 40% delivery, 40% open, 20% click
  return Math.round((deliveryRate * 0.4 + openRate * 0.4 + clickRate * 0.2));
});

// Method to calculate and update analytics
notificationCampaignSchema.methods.updateAnalytics = async function() {
  const NotificationLog = mongoose.model('NotificationLog');
  
  const stats = await NotificationLog.getCampaignStats(this.campaignId);
  if (stats.length > 0) {
    const stat = stats[0];
    
    // Update delivery metrics
    this.analytics.delivery.sent = stat.totalSent;
    this.analytics.delivery.delivered = stat.totalDelivered;
    this.analytics.delivery.failed = stat.totalFailed;
    this.analytics.delivery.deliveryRate = stat.totalSent > 0 ? 
      Math.round((stat.totalDelivered / stat.totalSent) * 100) : 0;
    
    // Update engagement metrics
    this.analytics.engagement.opened = stat.totalOpened;
    this.analytics.engagement.clicked = stat.totalClicked;
    this.analytics.engagement.openRate = stat.totalDelivered > 0 ? 
      Math.round((stat.totalOpened / stat.totalDelivered) * 100) : 0;
    this.analytics.engagement.clickRate = stat.totalOpened > 0 ? 
      Math.round((stat.totalClicked / stat.totalOpened) * 100) : 0;
    
    // Update performance metrics
    this.analytics.performance.avgTimeToOpen = stat.avgTimeToOpen;
    this.analytics.performance.avgTimeToClick = stat.avgTimeToClick;
  }
  
  return this.save();
};

// Method to check if campaign can be executed
notificationCampaignSchema.methods.canExecute = function() {
  const checks = {
    hasValidTemplate: !!this.template.templateId,
    hasValidTargeting: this.targeting.segments.length > 0 || 
                      this.targeting.tags.include.length > 0,
    isApproved: this.compliance.approved,
    isScheduledOrImmediate: this.scheduling.sendType === 'immediate' || 
                           (this.scheduling.sendType === 'scheduled' && this.scheduling.scheduledAt),
    isNotCompleted: !['completed', 'cancelled', 'failed'].includes(this.status)
  };
  
  const canExecute = Object.values(checks).every(check => check);
  
  return {
    canExecute,
    checks,
    blockers: Object.keys(checks).filter(key => !checks[key])
  };
};

// Static method to find campaigns ready for execution
notificationCampaignSchema.statics.findReadyForExecution = function() {
  const now = new Date();
  
  return this.find({
    status: { $in: ['scheduled', 'running'] },
    'compliance.approved': true,
    $or: [
      { 'scheduling.sendType': 'immediate' },
      { 
        'scheduling.sendType': 'scheduled',
        'scheduling.scheduledAt': { $lte: now }
      }
    ]
  });
};

module.exports = mongoose.model('NotificationCampaign', notificationCampaignSchema);