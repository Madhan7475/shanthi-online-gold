const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'Pending'
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["phonepe"],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index to support my-orders pagination and date sorting efficiently
orderSchema.index({ userId: 1, date: -1 }, { name: 'userId_date_desc' });

module.exports = mongoose.model('Order', orderSchema);
