const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'],
    required: true
  },
  updatedBy: {
    type: String,
    enum: ['system', 'admin', 'user'],
    default: 'system',
    required: true
  },
  updatedByUserId: {
    type: String,
    // Store userId if updated by user, adminId if updated by admin
  },
  note: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Store additional context like IP, user agent, etc.
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
});

// Compound index for efficient queries
orderStatusHistorySchema.index({ orderId: 1, timestamp: -1 });
orderStatusHistorySchema.index({ status: 1, timestamp: -1 });

// Static method to create status history entry
orderStatusHistorySchema.statics.addStatusChange = async function(orderId, status, updatedBy = 'system', note = '', updatedByUserId = null, metadata = {}) {
  return await this.create({
    orderId,
    status,
    updatedBy,
    updatedByUserId,
    note,
    metadata,
    timestamp: new Date()
  });
};

// Static method to get status history for an order
orderStatusHistorySchema.statics.getOrderHistory = async function(orderId) {
  return await this.find({ orderId }).sort({ timestamp: 1 });
};

// Static method to get latest status for an order
orderStatusHistorySchema.statics.getLatestStatus = async function(orderId) {
  return await this.findOne({ orderId }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
