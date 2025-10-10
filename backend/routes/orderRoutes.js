const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');

// --- Admin Routes ---

// @route   GET api/orders/
// @desc    Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/orders/:id
// @desc    Update order status (for admin)
// ✅ FIX: Added the missing route for the admin panel to update order status.
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    const prevStatus = order.status;
    order.status = req.body.status;
    if (prevStatus !== order.status) {
      order.statusUpdatedAt = new Date();
    }
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(`Error updating order status for ${req.params.id}:`, err.message);
    res.status(500).send('Server Error');
  }
});


// --- Customer Routes ---

// @route   GET api/orders/my-orders
// @desc    Get orders for the logged-in user
// @access  Private
router.get('/my-orders', verifyAuthFlexible, async (req, res) => {
  try {
    // Determine the user's identifiers to match orders
    const ids = [];
    if (req.auth?.type === 'firebase') {
      ids.push(req.user.uid);
    } else if (req.auth?.type === 'jwt') {
      if (req.user.firebaseUid) ids.push(req.user.firebaseUid);
      ids.push(req.user.userId);
    }

    // Server-side pagination (defaults to 5, allow client 3–5+, clamp 1–10)
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limitRaw = parseInt(req.query.limit);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 5, 1), 5);
    const skip = (page - 1) * limit;

    const filter = { userId: { $in: ids } };

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items, total, page, pages });
  } catch (err) {
    console.error("Error fetching user's orders:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/:id
// @desc    Get a single order for the logged-in user
// @access  Private
router.get('/:id', verifyAuthFlexible, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const ids = [];
    if (req.auth?.type === 'firebase') {
      ids.push(req.user.uid);
    } else if (req.auth?.type === 'jwt') {
      if (req.user.firebaseUid) ids.push(req.user.firebaseUid);
      ids.push(req.user.userId);
    }

    if (!ids.includes(order.userId.toString())) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(`Error fetching order ${req.params.id}:`, err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid Order ID format' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/orders/cod
// @desc    Create a new order for Cash on Delivery
// @access  Private
router.post('/cod', verifyAuthFlexible, async (req, res) => {
  const { customer, items, total } = req.body;

  if (!customer || !items || !total) {
    return res.status(400).json({ msg: 'Please provide all required order data.' });
  }

  try {
    // Choose a consistent identifier for orders
    let userIdForOrder = null;
    if (req.auth?.type === 'firebase') {
      userIdForOrder = req.user.uid;
    } else if (req.auth?.type === 'jwt') {
      userIdForOrder = req.user.firebaseUid || req.user.userId;
    }

    const newOrder = new Order({
      userId: userIdForOrder,
      customerName: customer.name,
      items: items,
      total: total,
      status: 'Pending',
      deliveryAddress: customer.deliveryAddress,
      paymentMethod: customer.paymentMethod,
    });
    await newOrder.save();

    const newInvoice = new Invoice({
      customerName: customer.name,
      amount: total,
      status: 'Pending',
      orderId: newOrder._id,
    });
    await newInvoice.save();

    res.status(201).json({
      msg: 'Order placed successfully!',
      order: newOrder
    });

  } catch (err) {
    console.error('Error creating COD order:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/orders/:id/cancel
// @desc    Allow a user to cancel their own order
// @access  Private
router.put('/:id/cancel', verifyAuthFlexible, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const ids = [];
    if (req.auth?.type === 'firebase') {
      ids.push(req.user.uid);
    } else if (req.auth?.type === 'jwt') {
      if (req.user.firebaseUid) ids.push(req.user.firebaseUid);
      ids.push(req.user.userId);
    }

    if (!ids.includes(order.userId.toString())) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    if (order.status !== 'Pending') {
      return res.status(400).json({ msg: 'Order cannot be cancelled.' });
    }

    const prevStatus = order.status;
    order.status = 'Cancelled';
    if (prevStatus !== order.status) {
      order.statusUpdatedAt = new Date();
    }
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
