const mongoose = require('mongoose');

/**
 * Payment Detail Schema
 * Individual payment transaction details from PhonePe
 */
const paymentDetailSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: false, // Not always available for failed payments
    default: null
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'UPI_COLLECT', 'UPI_QR', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'EMI', 'PAY_LATER', 'CASH'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  state: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'PENDING'],
    required: true
  },
  errorCode: {
    type: String,
    default: null
  },
  detailedErrorCode: {
    type: String,
    default: null
  },
  amount: {
    type: Number, // Amount in paisa
    required: true
  },
  amountInRupees: {
    type: Number, // Amount in rupees (derived)
    required: true
  }
}, { _id: false });

/**
 * Refund Detail Schema
 * Individual refund transaction details
 */
const refundDetailSchema = new mongoose.Schema({
  refundId: {
    type: String,
    required: true
  },
  merchantRefundId: {
    type: String,
    required: true
  },
  amount: {
    type: Number, // Amount in rupees
    required: true
  },
  status: {
    type: String,
    enum: ['accepted', 'completed', 'failed', 'pending'],
    default: 'pending'
  },
  errorCode: {
    type: String,
    default: null
  },
  detailedErrorCode: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  }
});

/**
 * Payment Schema
 * Main payment record associated with an order
 */
const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // PhonePe Transaction Details
  phonepeOrderId: {
    type: String,
    required: true,
    unique: true
  },
  phonepeTransactionId: {
    type: String,
    required: false, // Not always available for failed payments
    default: null
  },
  merchantId: {
    type: String,
    required: true
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially_Refunded'],
    default: 'Pending',
    index: true
  },
  
  // Payment Method and Gateway
  method: {
    type: String,
    default: 'PhonePe'
  },
  gateway: {
    type: String,
    default: 'PhonePe'
  },
  
  // Amount Details
  amount: {
    type: Number, // Amount in rupees
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },
  
  // Error Information (for failed payments)
  errorCode: {
    type: String,
    default: null
  },
  detailedErrorCode: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  
  // Payment Details Array (from PhonePe callback)
  paymentDetails: [paymentDetailSchema],
  
  // Refund Details Array
  refunds: [refundDetailSchema],
  
  // Additional Metadata
  callbackType: {
    type: String,
    enum: ['CHECKOUT_ORDER_COMPLETED', 'CHECKOUT_ORDER_FAILED'],
    default: null
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Audit Fields
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
paymentSchema.index({ phonepeTransactionId: 1 });
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
// Note: refunds.refundId index removed to prevent duplicate null key errors
// Refunds are searched within specific payments, so this index isn't needed

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total refunded amount
paymentSchema.virtual('totalRefundedAmount').get(function() {
  if (!this.refunds || this.refunds.length === 0) return 0;
  return this.refunds
    .filter(refund => refund.status === 'Completed')
    .reduce((total, refund) => total + refund.amount, 0);
});

// Virtual for remaining amount after refunds
paymentSchema.virtual('remainingAmount').get(function() {
  return this.amount - this.totalRefundedAmount;
});

// Method to add refund
paymentSchema.methods.addRefund = function(refundData) {
  this.refunds.push(refundData);
  
  // Update payment status based on refund amount
  const totalRefunded = this.totalRefundedAmount;
  if (totalRefunded >= this.amount) {
    this.status = 'Refunded';
  } else if (totalRefunded > 0) {
    this.status = 'Partially_Refunded';
  }
  
  return this.save();
};

// Method to update refund status
paymentSchema.methods.updateRefundStatus = function(refundId, status, errorData = null) {
  const refund = this.refunds.find(r => r.refundId === refundId);
  if (!refund) {
    throw new Error(`Refund ${refundId} not found`);
  }
  
  refund.status = status;
  
  // Set appropriate timestamp
  const now = new Date();
  switch (status) {
    case 'Accepted':
      refund.acceptedAt = now;
      break;
    case 'Completed':
      refund.completedAt = now;
      break;
    case 'Failed':
      refund.failedAt = now;
      if (errorData) {
        refund.errorCode = errorData.errorCode;
        refund.detailedErrorCode = errorData.detailedErrorCode;
      }
      break;
  }
  
  // Update overall payment status
  this._updatePaymentStatusFromRefunds();
  
  return this.save();
};

// Private method to update payment status based on refunds
paymentSchema.methods._updatePaymentStatusFromRefunds = function() {
  const completedRefunds = this.refunds.filter(r => r.status === 'Completed');
  const totalRefunded = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
  
  if (totalRefunded >= this.amount) {
    this.status = 'Refunded';
  } else if (totalRefunded > 0) {
    this.status = 'Partially_Refunded';
  }
  // If no refunds completed, keep original status (Completed/Failed)
};

module.exports = mongoose.model('Payment', paymentSchema);