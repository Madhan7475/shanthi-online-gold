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
  deliveryAddress: {
    type: String,
    required: true,
  },
  paymentMethod: { // ✅ ADD THIS FIELD
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
