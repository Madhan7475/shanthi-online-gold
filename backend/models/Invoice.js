const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'Pending' // e.g., Pending, Paid
  },
  orderId: { // ✅ ADD THIS FIELD
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
