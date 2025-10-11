// backend/services/notificationInit.js
// Centralized notification service initialization
// This keeps server.js clean and provides a single place to manage notification startup

/**
 * Initialize all notification services safely
 * This function is designed to be non-blocking and allow the app to start
 * even if notification services fail to initialize
 */
async function initializeNotificationServices() {
  try {
    console.log("Initializing notification services...");
    
    // Import services here to avoid loading them if not needed
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    const NotificationService = require("./NotificationService");
    
    // Initialize base notification service first
    try {
      const baseInitResult = await NotificationService.initialize();
      if (baseInitResult.success) {
        console.log("Base notification service ready");
      } else {
        console.warn("Base notification service initialization had issues:", baseInitResult.error);
      }
    } catch (baseError) {
      console.warn("Base notification service failed to initialize:", baseError.message);
      console.warn("   Device registration may still work, but push notifications will be disabled");
    }
    
    // Initialize automated notification service
    try {
      await AutomatedNotificationService.initialize();
      console.log("Automated notification service ready");
    } catch (autoError) {
      console.warn("Automated notification service failed to initialize:", autoError.message);
      console.warn("   Scheduled notifications will be disabled");
    }
    
    console.log("Notification services initialization completed");
    
  } catch (error) {
    console.error("Critical error during notification services initialization:", error.message);
    console.warn("   Application will continue running without notification services");
    console.warn("   Notifications will be disabled until services are manually restarted");
  }
}

/**
 * Get the status of all notification services
 * Useful for health checks and debugging
 */
async function getNotificationServicesStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  try {
    // Check base notification service
    const NotificationService = require("./NotificationService");
    status.services.base = {
      initialized: NotificationService.isInitialized || false,
      ready: NotificationService.isReady ? NotificationService.isReady() : false
    };
    
    // Add connection validation if service is ready
    if (status.services.base.ready) {
      try {
        const connectionStatus = await NotificationService.validateConnection();
        status.services.base.connection = connectionStatus;
      } catch (error) {
        status.services.base.connection = { success: false, error: error.message };
      }
    }
    
  } catch (error) {
    status.services.base = { error: "Service not available", details: error.message };
  }
  
  try {
    // Check automated notification service
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    status.services.automated = {
      initialized: AutomatedNotificationService.isInitialized || false,
      scheduledJobs: AutomatedNotificationService.scheduledJobs ? 
        AutomatedNotificationService.scheduledJobs.size : 0
    };
    
  } catch (error) {
    status.services.automated = { error: "Service not available", details: error.message };
  }
  
  return status;
}

/**
 * Restart notification services
 * Useful for manual recovery or configuration updates
 */
async function restartNotificationServices() {
  console.log("🔄 Restarting notification services...");
  
  try {
    // Stop any existing scheduled jobs
    const AutomatedNotificationService = require("./AutomatedNotificationService");
    if (AutomatedNotificationService.scheduledJobs) {
      AutomatedNotificationService.scheduledJobs.forEach((job, name) => {
        try {
          job.stop();
          console.log(`Stopped scheduled job: ${name}`);
        } catch (error) {
          console.warn(`Failed to stop job ${name}:`, error.message);
        }
      });
      AutomatedNotificationService.scheduledJobs.clear();
    }
    
    // Reset initialization flags
    AutomatedNotificationService.isInitialized = false;
    
    const NotificationService = require("./NotificationService");
    NotificationService.isInitialized = false;
    
    // Reinitialize
    await initializeNotificationServices();
    
    console.log("Notification services restarted successfully");
    return { success: true, message: "Services restarted successfully" };
    
  } catch (error) {
    console.error("Failed to restart notification services:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeNotificationServices,
  getNotificationServicesStatus,
  restartNotificationServices
};