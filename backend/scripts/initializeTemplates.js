// backend/scripts/initializeTemplates.js
const mongoose = require('mongoose');
require('dotenv').config();

const NotificationTemplate = require('../models/NotificationTemplate');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/shanthi-gold');

const initializeTemplates = async () => {
  try {
    console.log('🔄 Initializing notification templates...');

    // Import the AutomatedNotificationService to use its createDefaultTemplates method
    const automatedNotificationService = require('../services/AutomatedNotificationService');
    
    // Call the createDefaultTemplates method
    await automatedNotificationService.createDefaultTemplates();
    
    console.log('✅ Template initialization complete!');
    
    // Check how many templates we have now
    const templateCount = await NotificationTemplate.countDocuments();
    const activeTemplates = await NotificationTemplate.countDocuments({ status: 'active' });
    
    console.log(`📊 Total templates: ${templateCount}`);
    console.log(`📊 Active templates: ${activeTemplates}`);
    
    // List all template IDs
    const templates = await NotificationTemplate.find({}, 'templateId name type status').sort({ type: 1, templateId: 1 });
    
    console.log('\n📋 Available templates:');
    templates.forEach(template => {
      console.log(`  ${template.status === 'active' ? '✅' : '❌'} ${template.templateId} (${template.type}) - ${template.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeTemplates();