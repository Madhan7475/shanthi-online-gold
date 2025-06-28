// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // import your Mongoose model

// GET all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE order status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
