// backend/services/notificationInit.js
// Centralized notification service initialization
// This keeps server.js clean and provides a single place to manage notification startup

/**
 * Initialize enterprise notification system safely
 * This function is designed to be non-blocking and allow the app to start
 * even if notification services fail to initialize
 */
async function initializeNotificationServices() {
  try {
    console.log("🚀 Initializing enterprise notification system...");
    
    // Import all notification services
    const NotificationManager = require("./NotificationManager");
    const NotificationService = require("./NotificationService");
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    
    // Initialize base NotificationService first (required for device management)
    try {
      await NotificationService.initialize();
      console.log("✅ Base NotificationService ready");
      console.log("   📱 Firebase messaging initialized");
      console.log("   📲 Device management available");
    } catch (serviceError) {
      console.warn("❌ Base NotificationService failed to initialize:", serviceError.message);
      console.warn("   📱 Device registration will be disabled");
    }
    
    // Initialize the enterprise NotificationManager (depends on NotificationService)
    try {
      const initResult = await NotificationManager.initialize();
      if (initResult.success) {
        console.log("✅ Enterprise NotificationManager ready");
        console.log("   📋 Template engine initialized");
        console.log("   🔄 Notification queue started");
        console.log("   🏢 Enterprise-grade system active");
      } else {
        console.warn("⚠️ NotificationManager initialization had issues:", initResult.error);
      }
    } catch (managerError) {
      console.warn("❌ NotificationManager failed to initialize:", managerError.message);
      console.warn("   📱 Push notifications will be disabled");
    }
    
    // Initialize AutomatedNotificationService (depends on NotificationManager)
    try {
      await AutomatedNotificationService.initialize();
      console.log("✅ AutomatedNotificationService ready");
      console.log("   ⏰ Scheduled notifications active");
      console.log("   🛒 Cart abandonment tracking enabled");
      console.log("   💰 Gold price alerts enabled");
    } catch (automatedError) {
      console.warn("❌ AutomatedNotificationService failed to initialize:", automatedError.message);
      console.warn("   ⏰ Scheduled notifications will be disabled");
    }
    
    console.log("🎯 Enterprise notification system initialization completed");
    
  } catch (error) {
    console.error("💥 Critical error during notification system initialization:", error.message);
    console.warn("   🚀 Application will continue running without notification services");
    console.warn("   🔧 Notifications will be disabled until services are manually restarted");
  }
}

/**
 * Get the status of the enterprise notification system
 * Useful for health checks and debugging
 */
async function getNotificationServicesStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    system: 'enterprise',
    services: {}
  };
  
  try {
    // Check base NotificationService status
    const NotificationService = require("./NotificationService");
    status.services.base = {
      initialized: NotificationService.isInitialized || false,
      ready: NotificationService.isReady ? NotificationService.isReady() : false
    };
    
    // Test connection if ready
    if (status.services.base.ready) {
      try {
        const connectionTest = await NotificationService.validateConnection();
        status.services.base.connection = connectionTest;
      } catch (error) {
        status.services.base.connection = { success: false, error: error.message };
      }
    }
    
    // Check NotificationManager status
    const NotificationManager = require("./NotificationManager");
    status.services.manager = {
      initialized: NotificationManager.isInitialized || false,
      ready: NotificationManager.isReady ? NotificationManager.isReady() : false
    };
    
    // Get queue health if available
    if (status.services.manager.ready && NotificationManager.getQueueHealth) {
      try {
        const queueHealth = await NotificationManager.getQueueHealth();
        status.services.queue = queueHealth;
      } catch (error) {
        status.services.queue = { error: "Queue health check failed", details: error.message };
      }
    }
    
    // Get template cache status if available
    if (status.services.manager.ready && NotificationManager.getTemplateStatus) {
      try {
        const templateStatus = await NotificationManager.getTemplateStatus();
        status.services.templates = templateStatus;
      } catch (error) {
        status.services.templates = { error: "Template status check failed", details: error.message };
      }
    }
    
    // Check AutomatedNotificationService status
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    status.services.automated = {
      initialized: AutomatedNotificationService.isInitialized || false,
      canSendNotifications: AutomatedNotificationService.canSendNotifications ? AutomatedNotificationService.canSendNotifications() : false,
      scheduledJobs: AutomatedNotificationService.scheduledJobs ? AutomatedNotificationService.scheduledJobs.size : 0
    };
    
  } catch (error) {
    status.services.error = { message: "Service status check failed", details: error.message };
  }
  
  return status;
}

/**
 * Restart enterprise notification system
 * Useful for manual recovery or configuration updates
 */
async function restartNotificationServices() {
  console.log("🔄 Restarting enterprise notification system...");
  
  try {
    // Import all services
    const NotificationManager = require("./NotificationManager");
    const NotificationService = require("./NotificationService");
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    
    // Gracefully shutdown services in reverse order
    
    // 1. Stop AutomatedNotificationService first (stops cron jobs)
    if (AutomatedNotificationService.stop) {
      try {
        AutomatedNotificationService.stop();
        console.log("📴 AutomatedNotificationService stopped");
      } catch (shutdownError) {
        console.warn("⚠️ AutomatedNotificationService shutdown had issues:", shutdownError.message);
      }
    }
    AutomatedNotificationService.isInitialized = false;
    
    // 2. Stop NotificationManager
    if (NotificationManager.shutdown) {
      try {
        await NotificationManager.shutdown();
        console.log("📴 NotificationManager gracefully shutdown");
      } catch (shutdownError) {
        console.warn("⚠️ NotificationManager shutdown had issues:", shutdownError.message);
      }
    }
    NotificationManager.isInitialized = false;
    
    // 3. Reset NotificationService
    NotificationService.isInitialized = false;
    
    // Reinitialize the entire enterprise system
    await initializeNotificationServices();
    
    console.log("✅ Enterprise notification system restarted successfully");
    return { success: true, message: "Enterprise notification system restarted successfully" };
    
  } catch (error) {
    console.error("❌ Failed to restart notification system:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeNotificationServices,
  getNotificationServicesStatus,
  restartNotificationServices
};