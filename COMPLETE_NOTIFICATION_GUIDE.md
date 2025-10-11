# 📱 Shanthi Online Gold - Complete Notification System Guide

## 🌟 Overview

This comprehensive guide covers the complete notification system for Shanthi Online Gold, including push notifications, gold price alerts, e-commerce notifications, and testing capabilities.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [API Endpoints](#api-endpoints)
3. [Notification Types](#notification-types)
4. [Testing System](#testing-system)
5. [Integration Guide](#integration-guide)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

## 🏗️ System Architecture

### Core Components

1. **NotificationService.js** - Core notification delivery service
2. **AutomatedNotificationService.js** - Scheduled and automated notifications
3. **Firebase Admin SDK** - Push notification delivery via FCM
4. **MongoDB Models** - Data persistence and user management
5. **Gold Price Integration** - Real-time gold price notifications

### Route Structure

- **Production Routes**: `/api/notifications/*` - Live notification management
- **Market Routes**: `/api/market/*` - Gold price operations
- **Test Routes**: `/api/test-notifications/*` - Comprehensive testing system

### Database Models

- **UserDevice** - Device registration and preferences
- **NotificationTemplate** - Message templates
- **NotificationLog** - Delivery tracking and analytics
- **NotificationCampaign** - Bulk notification campaigns

## 🔗 API Endpoints

### Health & Status

#### `GET /api/notifications/health`
Check notification service health status.

**Response:**
```json
{
  "service": "notification",
  "status": "healthy",
  "initialized": true,
  "connection": { "success": true },
  "stats": {
    "activeDevices": 25,
    "activeTemplates": 10
  }
}
```

### Device Management

#### `POST /api/notifications/devices/register`
Register a device for push notifications.

**Request:**
```json
{
  "fcmToken": "device-fcm-token",
  "platform": "android",
  "deviceId": "unique-device-id",
  "appVersion": "1.0.0",
  "osVersion": "14.0",
  "deviceModel": "Pixel 7",
  "manufacturer": "Google",
  "locale": "en-IN",
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "deviceId": "60f7b3d4e1b2c3d4e5f6g7h8",
  "isNewDevice": true
}
```

#### `GET /api/notifications/devices`
Get user's registered devices.

#### `GET /api/notifications/preferences`
Get notification preferences for all user devices.

#### `PUT /api/notifications/devices/:deviceId/preferences`
Update notification preferences for a specific device.

**Request:**
```json
{
  "enabled": true,
  "promotional": true,
  "userSpecific": true,
  "transactional": true,
  "engagement": true,
  "seasonal": true,
  "quietHours": {
    "enabled": false,
    "startTime": "22:00",
    "endTime": "08:00"
  },
  "maxPerDay": 20,
  "maxPerHour": 5
}
```

### Notification History & Tracking

#### `GET /api/notifications/history`
Get user's notification history with pagination.

#### `POST /api/notifications/track/:notificationId/:action`
Track notification interactions (opened, clicked, dismissed, converted).

### Admin Routes

#### `GET /api/notifications/admin/templates`
Get all notification templates (admin only).

#### `POST /api/notifications/admin/templates`
Create new notification template (admin only).

#### `POST /api/notifications/send`
Send notification to specific users (admin only).

**Request:**
```json
{
  "userId": "user-id-123",
  "templateId": "DAILY_GOLD_PRICE",
  "variables": {
    "goldPrice": "6850",
    "priceChange": "increased",
    "changeAmount": "75"
  },
  "priority": "normal"
}
```

### Gold Price Routes

#### `GET /api/market/gold/price`
Get current gold prices (public endpoint).

**Response:**
```json
{
  "pricePerGram24kInr": 6850,
  "pricePerGram22kInr": 6280,
  "currency": "INR",
  "unit": "GRAM",
  "lastUpdated": "2024-10-11T12:00:00Z",
  "source": "GoldAPI.io"
}
```

#### `POST /api/market/admin/gold/refresh`
Force refresh gold prices (admin only).

## 📨 Notification Types

### Transactional Notifications

#### Order Confirmation (`ORDER_CONFIRMED`)
Sent when an order is successfully placed.

**Variables:**
- `orderNumber` - Order reference number
- `itemCount` - Number of items ordered
- `totalAmount` - Total order value
- `estimatedDelivery` - Delivery timeline
- `orderId` - Order ID for tracking

**Example:**
> **Order Confirmed! Order #ORD123456**
> 
> Your order of 3 beautiful pieces worth ₹45,000 has been confirmed. Estimated delivery: 5-7 business days.

#### Order Shipped (`ORDER_SHIPPED`)
Sent when an order is dispatched.

**Variables:**
- `orderNumber` - Order reference
- `totalAmount` - Order value
- `trackingId` - Shipping tracking ID
- `orderId` - Order ID

**Example:**
> **Your Order is On Its Way!**
> 
> Order #ORD123456 has been shipped! Track your ₹45,000 jewelry order with tracking ID: TRK12345.

### User-Specific Notifications

#### Cart Abandonment - 1 Hour (`CART_ABANDONMENT_1H`)
Sent 1 hour after items are added to cart but not purchased.

**Variables:**
- `itemCount` - Number of items in cart
- `totalValue` - Total cart value

**Example:**
> **Your beautiful jewelry is waiting!**
> 
> Don't miss out on 2 stunning pieces in your cart. Complete your purchase now and get FREE shipping!

#### Cart Abandonment - 24 Hours (`CART_ABANDONMENT_24H`)
Sent 24 hours after cart abandonment with discount offer.

**Variables:**
- `itemCount` - Number of items
- `totalValue` - Cart value

**Example:**
> **Still thinking? Get 5% off your jewelry!**
> 
> Your 2 selected pieces are still waiting. Use code SAVE5 for 5% off your ₹25,000 order!

#### Wishlist Price Drop (`WISHLIST_PRICE_DROP`)
Sent when a wishlist item price drops.

**Variables:**
- `productName` - Product name
- `newPrice` - Discounted price
- `savings` - Amount saved
- `productId` - Product ID for deep link

**Example:**
> **Price Drop Alert!**
> 
> Gold Diamond Necklace in your wishlist is now ₹35,000! Save ₹5,000 on this beautiful piece.

#### Back in Stock (`BACK_IN_STOCK`)
Sent when out-of-stock wishlist items are available again.

**Variables:**
- `productName` - Product name
- `price` - Current price
- `productId` - Product ID

**Example:**
> **Elegant Gold Earrings is Back in Stock!**
> 
> Great news! Elegant Gold Earrings from your wishlist is now available for ₹15,000. Hurry, limited stock!

### Promotional Notifications

#### Daily Gold Price (`DAILY_GOLD_PRICE`)
Daily gold price updates for engaged users.

**Variables:**
- `goldPrice` - Current gold price per gram
- `priceChange` - "increased" or "decreased"
- `changeAmount` - Change amount
- `priceMessage` - Contextual message

**Example:**
> **Today's Gold Rate: ₹6,850/gram**
> 
> Gold increased by ₹75/gram today. Great time to sell your gold!

#### New Collection Launch (`NEW_COLLECTION_LAUNCH`)
Announce new jewelry collections.

**Variables:**
- `collectionName` - Collection name
- `itemCount` - Number of items
- `startingPrice` - Starting price
- `collectionSlug` - URL slug

**Example:**
> **New Diwali Special Collection is Here!**
> 
> Discover 25 stunning new pieces starting from ₹12,000. Be the first to explore!

#### Festival Wishes (`FESTIVAL_WISHES`)
Festival greetings with special offers.

**Variables:**
- `festivalName` - Festival name
- `discount` - Discount percentage
- `festivalSlug` - Sale page slug

**Example:**
> **Happy Diwali!**
> 
> Celebrate Diwali with our exclusive 15% off on all jewelry! Make this festival more special.

### Engagement Notifications

#### Re-engagement (`RE_ENGAGEMENT`)
Win back inactive users.

**Example:**
> **We Miss You! Come Back for 10% Off**
> 
> It's been a while! Discover new collections and get 10% off your next purchase. Your perfect jewelry awaits!

## 🧪 Testing System

### Dedicated Test Routes (`/api/test-notifications`)

The testing system provides comprehensive testing capabilities without affecting production users.

#### Get Testing Overview
```bash
GET /api/test-notifications/
```

#### Set Up Test Device
```bash
POST /api/test-notifications/setup-device
{
  "userId": "test-user-123",
  "platform": "android",
  "enableAllNotifications": true
}
```

#### Test Individual Notification Types
```bash
POST /api/test-notifications/send/:type
{
  "userId": "test-user-123",
  "customVariables": {
    "goldPrice": "6900",
    "priceChange": "increased"
  }
}
```

Available test types:
- `order_confirmed` - Order confirmation
- `order_shipped` - Order shipping
- `cart_abandonment_1h` - 1-hour cart abandonment
- `cart_abandonment_24h` - 24-hour cart abandonment
- `wishlist_price_drop` - Price drop alert
- `back_in_stock` - Back in stock alert
- `daily_gold_price` - Gold price update
- `new_collection_launch` - New collection
- `festival_wishes` - Festival greetings
- `re_engagement` - Re-engagement campaign

#### Test All Notification Types
```bash
POST /api/test-notifications/send-all
{
  "userId": "test-user-123",
  "delay": 1000
}
```

#### Test Gold Price Notifications
```bash
POST /api/test-notifications/gold-price
{
  "userId": "test-user-123",
  "useRealData": false,
  "simulatedPrice": 6850,
  "simulatedChange": "increased",
  "simulatedAmount": "75"
}
```

#### Test E-commerce Flow
```bash
POST /api/test-notifications/ecommerce-flow
{
  "userId": "test-user-123",
  "flowDelay": 2000
}
```

#### Check Service Status
```bash
GET /api/test-notifications/service-status
```

### Quick Testing Commands

#### Set Up and Test Gold Price Notification
```bash
# 1. Set up test device
curl -X POST http://localhost:9000/api/test-notifications/setup-device \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"userId": "test-user-123"}'

# 2. Test gold price notification
curl -X POST http://localhost:9000/api/test-notifications/send/daily_gold_price \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"userId": "test-user-123"}'
```

#### Test Complete E-commerce Flow
```bash
curl -X POST http://localhost:9000/api/test-notifications/ecommerce-flow \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"userId": "test-user-123", "flowDelay": 3000}'
```

#### Test All Notification Types
```bash
curl -X POST http://localhost:9000/api/test-notifications/send-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"userId": "test-user-123", "delay": 1500}'
```

## 🔧 Integration Guide

### Frontend Integration

#### 1. Device Registration
Register the device when the app starts:

```javascript
// Register device for notifications
const registerDevice = async () => {
  try {
    const fcmToken = await getFCMToken(); // Get FCM token
    const deviceInfo = await getDeviceInfo(); // Get device details
    
    const response = await fetch('/api/notifications/devices/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fcmToken,
        platform: deviceInfo.platform,
        deviceId: deviceInfo.deviceId,
        appVersion: deviceInfo.appVersion,
        osVersion: deviceInfo.osVersion,
        deviceModel: deviceInfo.model,
        manufacturer: deviceInfo.manufacturer,
        locale: 'en-IN',
        timezone: 'Asia/Kolkata'
      })
    });
    
    const result = await response.json();
    console.log('Device registered:', result);
  } catch (error) {
    console.error('Device registration failed:', error);
  }
};
```

#### 2. Handle FCM Token Updates
Update the token when it changes:

```javascript
// Handle FCM token refresh
onTokenRefresh((newToken) => {
  updateFCMToken(deviceId, newToken);
});

const updateFCMToken = async (deviceId, newToken) => {
  try {
    await fetch(`/api/notifications/devices/${deviceId}/token`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fcmToken: newToken })
    });
  } catch (error) {
    console.error('Token update failed:', error);
  }
};
```

#### 3. Track Notification Interactions
Track when users interact with notifications:

```javascript
// Track notification opened
const trackNotificationOpened = async (notificationId) => {
  try {
    await fetch(`/api/notifications/track/${notificationId}/opened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'mobile_app'
      })
    });
  } catch (error) {
    console.error('Tracking failed:', error);
  }
};
```

#### 4. Manage Notification Preferences
Allow users to control their notification preferences:

```javascript
// Get user preferences
const getNotificationPreferences = async () => {
  try {
    const response = await fetch('/api/notifications/preferences', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get preferences:', error);
  }
};

// Update preferences
const updatePreferences = async (deviceId, preferences) => {
  try {
    const response = await fetch(`/api/notifications/devices/${deviceId}/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
};
```

### Backend Integration

#### 1. Trigger Order Notifications
Integrate with your order processing:

```javascript
const AutomatedNotificationService = require('./services/AutomatedNotificationService');

// When order is confirmed
await AutomatedNotificationService.triggerOrderNotification(orderId, 'confirmed');

// When order is shipped
await AutomatedNotificationService.triggerOrderNotification(orderId, 'shipped');
```

#### 2. Send Custom Notifications
Send notifications programmatically:

```javascript
const NotificationService = require('./services/NotificationService');

// Send custom notification
const result = await NotificationService.sendNotification({
  userId: 'user-id-123',
  templateId: template._id,
  variables: {
    productName: 'Gold Diamond Ring',
    price: '25000'
  },
  priority: 'high',
  source: 'automated'
});
```

## ⚙️ Configuration

### Environment Variables

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Gold Price API Configuration
GOLDAPI_KEY=your-goldapi-key
METALS_API_KEY=your-metals-api-key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/shanthi-gold

# Server Configuration
PORT=9000
FRONTEND_URL=http://localhost:5173
```

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing one
   - Enable Cloud Messaging

2. **Generate Service Account Key**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file

3. **Configure Environment Variables**
   - Extract values from the downloaded JSON
   - Set in your `.env` file

### Notification Templates

Templates are automatically created during service initialization. You can also create custom templates via the admin API:

```json
{
  "templateId": "CUSTOM_TEMPLATE",
  "name": "Custom Notification",
  "type": "promotional",
  "title": "{{title}}",
  "body": "{{message}}",
  "variables": [
    {"key": "title", "required": true},
    {"key": "message", "required": true}
  ],
  "action": {
    "type": "deep_link",
    "value": "/custom-page",
    "buttonText": "View Details"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Notification service not ready"
**Cause:** Firebase Admin SDK not properly initialized

**Solutions:**
```bash
# Check Firebase configuration
curl http://localhost:9000/api/notifications/health

# Check service status
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/test-notifications/service-status

# Restart services
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/notifications/admin/services/restart
```

#### 2. "No active devices found"
**Cause:** User hasn't registered any devices or devices are inactive

**Solutions:**
```bash
# Check user devices
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:9000/api/notifications/devices

# Set up test device
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/test-notifications/setup-device \
  -d '{"userId": "test-user-123"}'
```

#### 3. "Template not found"
**Cause:** Notification template doesn't exist or is inactive

**Solutions:**
```bash
# Check available templates
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/notifications/admin/templates

# Check test types
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/test-notifications/
```

#### 4. FCM Token Issues
**Cause:** Invalid or expired FCM tokens

**Solutions:**
- Regenerate FCM token on the client
- Update token using the device token update endpoint
- Check Firebase project configuration

#### 5. Database Connection Issues
**Cause:** MongoDB connection problems

**Solutions:**
- Check MongoDB connection string
- Verify database is running
- Check network connectivity

### Debugging Commands

```bash
# Check overall system health
curl http://localhost:9000/api/notifications/health

# Get detailed service status
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/test-notifications/service-status

# Check gold price integration
curl http://localhost:9000/api/market/gold/price

# Test notification delivery
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/test-notifications/send/daily_gold_price \
  -d '{"userId": "test-user-123"}'

# Check notification history
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:9000/api/notifications/history

# Clean up duplicate devices
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/notifications/admin/cleanup-duplicates
```

### Logging

Enable verbose logging by setting:
```bash
DEBUG=notification:*
```

Log files locations:
- Server logs: Console output
- Firebase logs: Firebase Console > Cloud Messaging
- Database logs: MongoDB logs

## 📊 Analytics & Monitoring

### Notification Analytics

Get comprehensive notification analytics:

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:9000/api/notifications/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1250,
    "totalDelivered": 1180,
    "totalFailed": 70,
    "totalOpened": 845,
    "totalClicked": 320,
    "totalConverted": 125,
    "deliveryRate": 94.4,
    "openRate": 71.6,
    "clickRate": 27.1,
    "conversionRate": 10.6
  }
}
```

### Firebase Console Monitoring

Monitor notification delivery in real-time:
1. Go to Firebase Console
2. Navigate to Cloud Messaging
3. View delivery reports and analytics
4. Monitor token refresh patterns

### Database Analytics

Monitor device and template usage:
```javascript
// Active devices by platform
db.userdevices.aggregate([
  {$match: {isActive: true}},
  {$group: {_id: "$deviceInfo.platform", count: {$sum: 1}}}
])

// Notification delivery stats
db.notificationlogs.aggregate([
  {$group: {
    _id: "$delivery.status",
    count: {$sum: 1}
  }}
])
```

## 🚀 Production Deployment Checklist

### Pre-deployment

- [ ] Firebase configuration verified for production
- [ ] Environment variables properly set
- [ ] Database indexes created
- [ ] SSL certificates configured
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up

### Testing

- [ ] All notification types tested
- [ ] Device registration tested on multiple platforms
- [ ] FCM token refresh tested
- [ ] Deep links tested and working
- [ ] Notification preferences tested
- [ ] Analytics and tracking tested
- [ ] Error handling tested

### Security

- [ ] Admin routes properly secured
- [ ] User authentication working
- [ ] FCM tokens protected
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection enabled

### Performance

- [ ] Database queries optimized
- [ ] Indexes created for frequent queries
- [ ] Caching implemented where appropriate
- [ ] Background job processing optimized
- [ ] Memory usage monitored

### Monitoring

- [ ] Health check endpoints configured
- [ ] Log aggregation set up
- [ ] Error tracking implemented
- [ ] Performance monitoring enabled
- [ ] Alert thresholds configured

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check notification delivery rates
   - Monitor FCM token refresh patterns
   - Review error logs
   - Update templates if needed

2. **Monthly:**
   - Clean up inactive devices
   - Analyze notification performance
   - Update documentation
   - Review and optimize templates

3. **Quarterly:**
   - Review notification strategy
   - Update Firebase SDK if needed
   - Performance optimization
   - Security audit

### Getting Help

1. **Check Documentation:** This comprehensive guide covers most use cases
2. **Use Test Endpoints:** Debug issues using the testing system
3. **Check Logs:** Server and Firebase console logs provide detailed error information
4. **Health Checks:** Use health endpoints to diagnose system status

---

## 🎉 Conclusion

This notification system provides comprehensive push notification capabilities for the Shanthi Online Gold application, including:

- **Complete device management** with preferences control
- **Multiple notification types** for different use cases
- **Gold price integration** with automated updates
- **Comprehensive testing system** for easy debugging
- **Analytics and tracking** for performance monitoring
- **Production-ready architecture** with proper error handling

The system is designed to be scalable, maintainable, and easy to integrate with both mobile applications and web interfaces.

**Happy notifying! 🚀**