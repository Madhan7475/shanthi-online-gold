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
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
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
    enum: ["phonepe", "cod", "online"],
    default: "phonepe"
  },
  
  // PhonePe Integration Fields
  phonepeOrderId: {
    type: String
    // Index defined separately as sparse
  },
  transactionId: {
    type: String
    // Index defined separately as sparse
  },
  
  // Audit Fields
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, date: -1 }, { name: 'userId_date_desc' });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ phonepeOrderId: 1 }, { sparse: true });
orderSchema.index({ transactionId: 1 }, { sparse: true });

// Update the updatedAt and statusUpdatedAt fields before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update statusUpdatedAt if status or paymentStatus changed
  if (this.isModified('status') || this.isModified('paymentStatus')) {
    this.statusUpdatedAt = new Date();
  }
  
  next();
});

// Virtual to get associated payments
orderSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'orderId'
});

// Method to update order status and payment status
orderSchema.methods.updateStatus = function(newStatus, newPaymentStatus = null) {
  this.status = newStatus;
  if (newPaymentStatus) {
    this.paymentStatus = newPaymentStatus;
  }
  this.statusUpdatedAt = new Date();
  return this.save();
};

// Enable virtuals in JSON output
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
