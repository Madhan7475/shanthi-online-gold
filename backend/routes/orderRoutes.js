const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const OrderStatusHistory = require("../models/OrderStatusHistory");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");
const NotificationManager = require("../services/NotificationManager");
const resolveUser = require("../utils/helper");

// --- Admin Routes ---

// @route   GET api/orders/
// @desc    Get all orders (for admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/orders/:id
// @desc    Update order status (for admin)
// ✅ FIX: Added the missing route for the admin panel to update order status.
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    const prevStatus = order.status?.toLowerCase();
    const newStatus = req.body.status?.toLowerCase();
    const note = req.body.note || '';

    order.status = newStatus?.toLowerCase();
    order.paymentStatus = order.paymentStatus?.toLowerCase(); // Keep existing payment status unless specified otherwise
    console.log(
      `Updating order ${order._id} status from ${prevStatus} to ${newStatus}`
    );
    if (prevStatus !== order.status) {
      order.statusUpdatedAt = new Date();
      
      // Log status change to history
      await OrderStatusHistory.addStatusChange(
        order._id,
        newStatus,
        'admin',
        note || `Status changed from ${prevStatus} to ${newStatus}`,
        null, // adminId can be added if available
        { previousStatus: prevStatus }
      );
    }
    await order.save();

    // Trigger notification for status changes (enterprise single-call pattern)
    if (prevStatus !== newStatus) {
      // Single call to NotificationManager - handles everything internally
      setImmediate(async () => {
        try {
          const result = await NotificationManager.sendNotification({
            type: "order_status",
            trigger: "admin_action",
            data: {
              orderId: order._id,
              status: newStatus.toLowerCase(),
              previousStatus: prevStatus,
              updatedBy: "admin",
              updatedAt: new Date(),
            },
            recipients: order.userId, // Provide the user ID from the order
            options: {
              priority: "high",
            },
          });

          if (result.success) {
            console.log(
              `✅ Order notification queued: ${order._id} (${prevStatus} → ${newStatus}) - Queue ID: ${result.queueId}`
            );
          } else {
            console.warn(
              `⚠️ Order notification failed: ${order._id} - ${result.error}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error sending order notification for ${order._id}:`,
            error.message
          );
          // Non-blocking - notification failure doesn't affect order update
        }
      });

      console.log(
        `Order ${order._id} status: ${prevStatus} → ${newStatus} (notification processing)`
      );
    }

    res.json(order);
  } catch (err) {
    console.error(
      `Error updating order status for ${req.params.id}:`,
      err.message
    );
    res.status(500).send("Server Error");
  }
});

// --- Customer Routes ---

// @route   GET api/orders/my-orders
// @desc    Get orders for the logged-in user
// @access  Private
router.get("/my-orders", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Server-side pagination (defaults to 5, allow client 3–5+, clamp 1–10)
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limitRaw = parseInt(req.query.limit);
    const limit = Math.min(
      Math.max(Number.isFinite(limitRaw) ? limitRaw : 5, 1),
      5
    );
    const skip = (page - 1) * limit;

    const filter = { userId: user._id };

    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    // Apply date range filter if provided
    const { startDate, endDate } = req.query;
    if (startDate) {
      const dateFilter = {};
      
      // Parse startDate
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ msg: "Invalid startDate format" });
      }
      start.setHours(0, 0, 0, 0); // Start of day
      dateFilter.$gte = start;

      // Parse endDate or use today if not provided
      let end;
      if (endDate) {
        end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ msg: "Invalid endDate format" });
        }
      } else {
        end = new Date(); // Today
      }
      end.setHours(23, 59, 59, 999); // End of day
      dateFilter.$lte = end;

      filter.date = dateFilter;
    }

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    // Get payment details for each order
    const orderIds = items.map((order) => order._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } });
    const paymentMap = new Map();
    payments.forEach((payment) => {
      paymentMap.set(payment.orderId.toString(), {
        id: payment._id,
        phonepeOrderId: payment.phonepeOrderId,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        completedAt: payment.completedAt,
        failedAt: payment.failedAt,
        totalRefundedAmount: payment.totalRefundedAmount,
        remainingAmount: payment.remainingAmount,
        hasRefunds: payment.refunds && payment.refunds.length > 0,
      });
    });

    // Add payment details to orders
    const itemsWithPayments = items.map((order) => ({
      ...order.toObject(),
      payment: paymentMap.get(order._id.toString()) || null,
    }));

    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items: itemsWithPayments, total, page, pages });
  } catch (err) {
    console.error("Error fetching user's orders:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/orders/:id
// @desc    Get a single order for the logged-in user
// @access  Private
router.get("/:id", verifyAuthFlexible, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (user._id.toString() !== order.userId.toString()) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get payment details for this order
    const payment = await Payment.findOne({ orderId: order._id });
    
    // Get status history for this order
    const statusHistory = await OrderStatusHistory.getOrderHistory(order._id);

    const orderResponse = {
      ...order.toObject(),
      payment: payment
        ? {
            id: payment._id,
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
            remainingAmount: payment.remainingAmount,
          }
        : null,
      statusHistory: statusHistory || [],
    };

    res.json(orderResponse);
  } catch (err) {
    console.error(`Error fetching order ${req.params.id}:`, err.message);
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Invalid Order ID format" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/orders/:id/cancel
// @desc    Allow a user to cancel their own order
// @access  Private
router.put("/:id/cancel", verifyAuthFlexible, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user._id.toString() !== order.userId.toString()) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    if (order.status?.toLowerCase() !== "pending") {
      return res.status(400).json({ msg: "Order cannot be cancelled." });
    }

    const prevStatus = order.status;
    order.status = "cancelled";
    if (prevStatus !== order.status) {
      order.statusUpdatedAt = new Date();
      
      // Log cancellation to history
      await OrderStatusHistory.addStatusChange(
        order._id,
        'cancelled',
        'user',
        'Order cancelled by customer',
        user._id.toString(),
        { previousStatus: prevStatus }
      );
    }
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
