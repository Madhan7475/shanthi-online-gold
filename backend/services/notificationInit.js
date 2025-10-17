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
    
    // Import the unified NotificationManager (enterprise single entry point)
    const NotificationManager = require("./NotificationManager");
    
    // Initialize the enterprise notification system
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
      console.warn("   🛠️ System will continue without notification capabilities");
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
    
  } catch (error) {
    status.services.manager = { error: "NotificationManager not available", details: error.message };
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
    // Import NotificationManager
    const NotificationManager = require("./NotificationManager");
    
    // Gracefully shutdown if available
    if (NotificationManager.shutdown) {
      try {
        await NotificationManager.shutdown();
        console.log("📴 NotificationManager gracefully shutdown");
      } catch (shutdownError) {
        console.warn("⚠️ Shutdown had issues:", shutdownError.message);
      }
    }
    
    // Reset initialization flags
    NotificationManager.isInitialized = false;
    
    // Reinitialize the enterprise system
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