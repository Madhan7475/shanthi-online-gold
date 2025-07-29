const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// ✅ FIX: Specific routes like '/my-orders' must come BEFORE general routes with parameters like '/:id'.

// @route   GET api/orders/my-orders
// @desc    Get orders for the logged-in user
// @access  Private
router.get('/my-orders', verifyFirebaseToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.uid }).sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user's orders:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/:id
// @desc    Get a single order for the logged-in user
// @access  Private
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.uid) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(`Error fetching order ${req.params.id}:`, err.message);
    // Handle CastError specifically for invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid Order ID format' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/orders/cod
// @desc    Create a new order for Cash on Delivery
// @access  Private
router.post('/cod', verifyFirebaseToken, async (req, res) => {
  const { customer, items, total } = req.body;

  if (!customer || !items || !total) {
    return res.status(400).json({ msg: 'Please provide all required order data.' });
  }

  try {
    const newOrder = new Order({
      userId: req.user.uid,
      customerName: customer.name,
      items: items,
      total: total,
      status: 'Pending',
      deliveryAddress: customer.deliveryAddress,
      paymentMethod: customer.paymentMethod, // ✅ Save payment method
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
router.put('/:id/cancel', verifyFirebaseToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    if (order.userId.toString() !== req.user.uid) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    if (order.status !== 'Pending') {
      return res.status(400).json({ msg: 'Order cannot be cancelled.' });
    }

    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
