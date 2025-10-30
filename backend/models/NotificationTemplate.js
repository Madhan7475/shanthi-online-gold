// backend/models/NotificationTemplate.js
const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  // Template identification
  templateId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  description: {
    type: String
  },
  
  // Template type for categorization
  type: {
    type: String,
    enum: [
      'promotional',           // Daily gold prices, sales, new collections
      'userSpecific',         // Cart abandonment, price drops, wishlist items
      'transactional',         // Order updates, payment confirmations
      'engagement',            // App re-engagement, recommendations
      'seasonal',              // Festival wishes, seasonal promotions
      'admin',                 // System alerts, admin notifications
      'system'                 // System-generated default templates
    ],
    required: true,
    index: true
  },
  
  // Template content with placeholder support
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Rich content for enhanced notifications
  imageUrl: {
    type: String
  },
  
  iconUrl: {
    type: String
  },
  
  // Action configuration
  action: {
    type: {
      type: String,
      enum: ['deep_link', 'url', 'none'],
      default: 'none'
    },
    value: String, // Deep link or URL
    buttonText: String
  },
  
  // Placeholder variables that can be replaced
  variables: [{
    key: String,        // e.g., 'customerName', 'productName', 'price'
    description: String, // Description of the variable
    required: {
      type: Boolean,
      default: false
    }
  }],
  
  // Scheduling and frequency rules
  scheduling: {
    allowedDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    allowedTimeSlots: [{
      start: String, // "09:00"
      end: String    // "18:00"
    }],
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  
  // Rate limiting and throttling
  rateLimit: {
    maxPerUser: {
      perHour: { type: Number, default: null },
      perDay: { type: Number, default: null },
      perWeek: { type: Number, default: null }
    },
    cooldownPeriod: { type: Number, default: 0 } // Minutes between same template
  },
  
  // Targeting rules
  targeting: {
    userSegments: [{
      type: String,
      enum: ['all', 'new_users', 'active_users', 'inactive_users', 'premium_customers', 'cart_abandoners']
    }],
    userTags: [String],
    customFilters: mongoose.Schema.Types.Mixed // For complex targeting
  },
  
  // Personalization settings
  personalization: {
    enabled: { type: Boolean, default: false },
    fields: [String] // Fields to personalize based on user data
  },
  
  // A/B testing support
  abTesting: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: String,
      title: String,
      body: String,
      weight: { type: Number, default: 50 } // Percentage split
    }]
  },
  
  // Analytics and tracking
  analytics: {
    trackDelivery: { type: Boolean, default: true },
    trackOpens: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true },
    trackConversions: { type: Boolean, default: false },
    conversionEvents: [String] // Events that count as conversions
  },
  
  // Template status and lifecycle
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Version control for template updates
  version: {
    type: Number,
    default: 1
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Allow system templates to not have a creator
      return !this.isSystemTemplate;
    }
  },
  
  // Flag to identify system-generated templates
  isSystemTemplate: {
    type: Boolean,
    default: false
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Template usage statistics
  stats: {
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    lastUsed: Date
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationTemplateSchema.index({ type: 1, status: 1 });
notificationTemplateSchema.index({ createdAt: -1 });
notificationTemplateSchema.index({ 'stats.lastUsed': -1 });

// Virtual for delivery rate
notificationTemplateSchema.virtual('deliveryRate').get(function() {
  if (this.stats.totalSent === 0) return 0;
  return ((this.stats.totalDelivered / this.stats.totalSent) * 100).toFixed(2);
});

// Virtual for open rate
notificationTemplateSchema.virtual('openRate').get(function() {
  if (this.stats.totalDelivered === 0) return 0;
  return ((this.stats.totalOpened / this.stats.totalDelivered) * 100).toFixed(2);
});

// Virtual for click-through rate
notificationTemplateSchema.virtual('clickRate').get(function() {
  if (this.stats.totalOpened === 0) return 0;
  return ((this.stats.totalClicked / this.stats.totalOpened) * 100).toFixed(2);
});

// Virtual for failure rate
notificationTemplateSchema.virtual('failureRate').get(function() {
  const totalAttempts = this.stats.totalSent + this.stats.totalFailed;
  if (totalAttempts === 0) return 0;
  return ((this.stats.totalFailed / totalAttempts) * 100).toFixed(2);
});

// Method to validate template variables
notificationTemplateSchema.methods.validateVariables = function(variables) {
  const requiredVars = this.variables.filter(v => v.required).map(v => v.key);
  const providedVars = Object.keys(variables || {});
  const missingVars = requiredVars.filter(v => !providedVars.includes(v));
  
  return {
    isValid: missingVars.length === 0,
    missingVariables: missingVars
  };
};

// Method to render template with variables
notificationTemplateSchema.methods.render = function(variables = {}) {
  let title = this.title;
  let body = this.body;
  let action = null;
  
  // Replace placeholders with actual values
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    title = title.replace(new RegExp(placeholder, 'g'), variables[key]);
    body = body.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  // Process action field if it exists
  if (this.action && this.action.value) {
    let actionValue = this.action.value;
    let buttonText = this.action.buttonText || "";
    
    // Replace placeholders in action value (deeplink/URL)
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      actionValue = actionValue.replace(new RegExp(placeholder, 'g'), variables[key]);
      buttonText = buttonText.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    action = {
      type: this.action.type,
      value: actionValue,
      buttonText: buttonText
    };
  }
  
  return { title, body, action };
};

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);