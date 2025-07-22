const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { // ✅ Link order to a user
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true
  },
  items: { // ✅ Store the products in the order
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'Pending' // e.g., Pending, Shipped, Delivered, Cancelled
  },
  deliveryAddress: { // ✅ Store the delivery address
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
