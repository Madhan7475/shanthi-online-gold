const express = require('express');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');

const router = express.Router();

/**
 * GET /api/payments/:orderId
 * Get payment details for a specific order
 */
router.get('/:orderId', verifyAuthFlexible, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // First verify the order belongs to the user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.userId !== req.user.uid && order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this order'
      });
    }

    // Get payment details
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        phonepeOrderId: payment.phonepeOrderId,
        phonepeTransactionId: payment.phonepeTransactionId,
        status: payment.status,
        method: payment.method,
        gateway: payment.gateway,
        amount: payment.amount,
        currency: payment.currency,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        failedAt: payment.failedAt,
        errorCode: payment.errorCode,
        detailedErrorCode: payment.detailedErrorCode,
        errorMessage: payment.errorMessage,
        paymentDetails: payment.paymentDetails,
        refunds: payment.refunds,
        totalRefundedAmount: payment.totalRefundedAmount,
        remainingAmount: payment.remainingAmount
      }
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/payments/phonepe/:phonepeOrderId
 * Get payment details by PhonePe order ID
 */
router.get('/phonepe/:phonepeOrderId', verifyAuthFlexible, async (req, res) => {
  try {
    const { phonepeOrderId } = req.params;
    
    const payment = await Payment.findOne({ phonepeOrderId })
      .populate('orderId', 'userId customerName total status paymentStatus');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this order
    const order = payment.orderId;
    if (order.userId !== req.user.uid && order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this payment'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        order: {
          id: order._id,
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus
        },
        phonepeOrderId: payment.phonepeOrderId,
        phonepeTransactionId: payment.phonepeTransactionId,
        status: payment.status,
        method: payment.method,
        gateway: payment.gateway,
        amount: payment.amount,
        currency: payment.currency,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        failedAt: payment.failedAt,
        errorCode: payment.errorCode,
        detailedErrorCode: payment.detailedErrorCode,
        errorMessage: payment.errorMessage,
        paymentDetails: payment.paymentDetails,
        refunds: payment.refunds,
        totalRefundedAmount: payment.totalRefundedAmount,
        remainingAmount: payment.remainingAmount
      }
    });

  } catch (error) {
    console.error('Error fetching payment by PhonePe order ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/payments/user/history
 * Get payment history for the authenticated user
 */
router.get('/user/history', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    // Build query for user's orders
    const orderQuery = { userId };
    const orders = await Order.find(orderQuery, '_id');
    const orderIds = orders.map(order => order._id);

    // Build payment query
    const paymentQuery = { orderId: { $in: orderIds } };
    if (status) {
      paymentQuery.status = status;
    }

    // Execute paginated query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(paymentQuery)
      .populate('orderId', 'customerName total status paymentStatus date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPayments = await Payment.countDocuments(paymentQuery);

    res.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment._id,
        order: {
          id: payment.orderId._id,
          customerName: payment.orderId.customerName,
          total: payment.orderId.total,
          status: payment.orderId.status,
          paymentStatus: payment.orderId.paymentStatus,
          date: payment.orderId.date
        },
        phonepeOrderId: payment.phonepeOrderId,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        failedAt: payment.failedAt,
        errorMessage: payment.errorMessage,
        totalRefundedAmount: payment.totalRefundedAmount,
        remainingAmount: payment.remainingAmount
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / parseInt(limit)),
        totalPayments,
        hasMore: skip + payments.length < totalPayments
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/payments/refunds/:paymentId
 * Get refund details for a specific payment
 */
router.get('/refunds/:paymentId', verifyAuthFlexible, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId)
      .populate('orderId', 'userId customerName');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this payment
    if (payment.orderId.userId !== req.user.uid && payment.orderId.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this payment'
      });
    }

    res.json({
      success: true,
      refunds: payment.refunds,
      paymentAmount: payment.amount,
      totalRefundedAmount: payment.totalRefundedAmount,
      remainingAmount: payment.remainingAmount,
      refundSummary: {
        totalRefunds: payment.refunds.length,
        completedRefunds: payment.refunds.filter(r => r.status === 'Completed').length,
        pendingRefunds: payment.refunds.filter(r => r.status === 'Accepted').length,
        failedRefunds: payment.refunds.filter(r => r.status === 'Failed').length
      }
    });

  } catch (error) {
    console.error('Error fetching refund details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;