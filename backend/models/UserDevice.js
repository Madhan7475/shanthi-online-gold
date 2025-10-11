// backend/models/UserDevice.js
const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: String, // Can be Firebase UID or local user ID
    required: true,
    index: true
  },
  
  // Device information
  fcmToken: {
    type: String,
    required: true,
    index: true
  },
  
  // Previous FCM token for tracking updates
  previousFcmToken: String,
  
  // Previous user ID for tracking device transfers
  previousUserId: String,
  
  // Device metadata
  deviceInfo: {
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    deviceId: String,
    appVersion: String,
    osVersion: String,
    deviceModel: String,
    manufacturer: String,
    locale: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  
  // Notification preferences
  preferences: {
    // Global notification toggle
    enabled: { type: Boolean, default: true },
    
    // Category-wise preferences
    promotional: { type: Boolean, default: true },
    userSpecific: { type: Boolean, default: true },
    transactional: { type: Boolean, default: true },
    engagement: { type: Boolean, default: true },
    seasonal: { type: Boolean, default: true },
    
    // Time-based preferences
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    },
    
    // Frequency preferences
    maxPerDay: { type: Number, default: 10 },
    maxPerHour: { type: Number, default: 3 }
  },
  
  // User segmentation tags
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Behavioral data for targeting
  behavior: {
    lastAppOpen: Date,
    totalAppOpens: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 }, // in seconds
    lastPurchase: Date,
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    favoriteCategories: [String],
    cartAbandonmentCount: { type: Number, default: 0 },
    wishlistItems: { type: Number, default: 0 }
  },
  
  // Location data (if permitted)
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  
  // Notification interaction statistics
  stats: {
    totalReceived: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    lastInteraction: Date,
    
    // Category-wise stats
    categoryStats: {
      promotional: {
        received: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      },
      userSpecific: {
        received: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      },
      transactional: {
        received: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 }
      }
    }
  },
  
  // Device activation status
  isActive: { type: Boolean, default: true },
  
  // Timestamp tracking
  registeredAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  tokenUpdatedAt: { type: Date, default: Date.now },
  userTransferredAt: Date, // When device was transferred between users
  deactivatedAt: Date, // When device was deactivated
  logoutAt: Date, // When user logged out from this device
  
  // Token status and health
  tokenStatus: {
    isActive: { type: Boolean, default: true },
    lastValidated: { type: Date, default: Date.now },
    failureCount: { type: Number, default: 0 },
    lastFailure: Date,
    failureReason: String
  },
  
  // Rate limiting tracking
  rateLimiting: {
    todayCount: { type: Number, default: 0 },
    hourlyCount: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    lastResetHour: { type: Number, default: new Date().getHours() }
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
userDeviceSchema.index({ userId: 1, 'tokenStatus.isActive': 1 });
userDeviceSchema.index({ 'deviceInfo.platform': 1, 'tokenStatus.isActive': 1 });
userDeviceSchema.index({ tags: 1 });
userDeviceSchema.index({ 'behavior.lastAppOpen': -1 });
userDeviceSchema.index({ createdAt: -1 });

// Geospatial index for location-based targeting (sparse to handle missing location data)
userDeviceSchema.index({ 'location.coordinates': '2dsphere' }, { sparse: true });

// TTL index to automatically clean up inactive tokens (90 days)
userDeviceSchema.index({ 'tokenStatus.lastValidated': 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual for engagement rate
userDeviceSchema.virtual('engagementRate').get(function() {
  if (this.stats.totalReceived === 0) return 0;
  return ((this.stats.totalOpened / this.stats.totalReceived) * 100).toFixed(2);
});

// Virtual for user segment
userDeviceSchema.virtual('userSegment').get(function() {
  const now = new Date();
  const daysSinceLastOpen = this.behavior.lastAppOpen ? 
    Math.floor((now - this.behavior.lastAppOpen) / (1000 * 60 * 60 * 24)) : 999;
  
  if (daysSinceLastOpen > 30) return 'inactive';
  if (daysSinceLastOpen > 7) return 'at_risk';
  if (this.behavior.totalPurchases === 0) return 'new_user';
  if (this.behavior.totalPurchases > 5) return 'loyal_customer';
  return 'active_user';
});

// Method to check if user is within quiet hours
userDeviceSchema.methods.isInQuietHours = function(timezone = null) {
  if (!this.preferences.quietHours.enabled) return false;
  
  const userTz = timezone || this.deviceInfo.timezone || 'Asia/Kolkata';
  const now = new Date();
  
  // Convert to user's timezone
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const startTime = this.preferences.quietHours.startTime.split(':');
  const endTime = this.preferences.quietHours.endTime.split(':');
  const quietStart = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const quietEnd = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (quietStart > quietEnd) {
    return currentTime >= quietStart || currentTime <= quietEnd;
  } else {
    return currentTime >= quietStart && currentTime <= quietEnd;
  }
};

// Method to check rate limits
userDeviceSchema.methods.canReceiveNotification = function() {
  const now = new Date();
  const today = now.toDateString();
  const currentHour = now.getHours();
  
  // Reset daily count if new day
  if (this.rateLimiting.lastResetDate.toDateString() !== today) {
    this.rateLimiting.todayCount = 0;
    this.rateLimiting.lastResetDate = now;
  }
  
  // Reset hourly count if new hour
  if (this.rateLimiting.lastResetHour !== currentHour) {
    this.rateLimiting.hourlyCount = 0;
    this.rateLimiting.lastResetHour = currentHour;
  }
  
  // Check limits
  const withinDailyLimit = this.rateLimiting.todayCount < this.preferences.maxPerDay;
  const withinHourlyLimit = this.rateLimiting.hourlyCount < this.preferences.maxPerHour;
  const notInQuietHours = !this.isInQuietHours();
  const tokenActive = this.tokenStatus.isActive;
  const notificationsEnabled = this.preferences.enabled;
  
  return {
    canReceive: withinDailyLimit && withinHourlyLimit && notInQuietHours && tokenActive && notificationsEnabled,
    reasons: {
      withinDailyLimit,
      withinHourlyLimit,
      notInQuietHours,
      tokenActive,
      notificationsEnabled
    }
  };
};

// Method to increment notification counters
userDeviceSchema.methods.incrementNotificationCount = function() {
  this.rateLimiting.todayCount += 1;
  this.rateLimiting.hourlyCount += 1;
  this.stats.totalReceived += 1;
  this.tokenStatus.lastValidated = new Date();
};

// Method to mark token as failed
userDeviceSchema.methods.markTokenFailed = function(reason) {
  if (!this.tokenStatus) {
    this.tokenStatus = {
      isActive: true,
      lastValidated: new Date(),
      failureCount: 0,
      lastFailure: null,
      failureReason: null
    };
  }
  
  this.tokenStatus.failureCount += 1;
  this.tokenStatus.isActive = false;
  this.tokenStatus.lastFailure = new Date();
  this.tokenStatus.failureReason = reason;
};

// Method to mark token as permanently invalid and deregister device
userDeviceSchema.methods.markTokenInvalid = function(reason) {  
  // Ensure tokenStatus object exists
  if (!this.tokenStatus) {
    this.tokenStatus = {
      isActive: true,
      lastValidated: new Date(),
      failureCount: 0,
      lastFailure: null,
      failureReason: null
    };
  }
  // Mark token as completely invalid
  this.tokenStatus.isActive = false;
  this.tokenStatus.failureReason = `Invalid token: ${reason}`;
  this.tokenStatus.lastFailure = new Date();
  this.tokenStatus.failureCount = 999; // High number to indicate permanent failure
  
  // Deregister the device completely
  this.isActive = false;
  this.deactivatedAt = new Date();
  
};

// Method to reset token health
userDeviceSchema.methods.markTokenHealthy = function() {
  this.tokenStatus.failureCount = 0;
  this.tokenStatus.lastFailure = null;
  this.tokenStatus.failureReason = null;
  this.tokenStatus.isActive = true;
  this.tokenStatus.lastValidated = new Date();
};

module.exports = mongoose.model('UserDevice', userDeviceSchema);