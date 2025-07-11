const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Order = require("../models/Order");

router.post("/", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { products, total, address } = req.body;

  const order = new Order({
    user: uid,
    products,
    total,
    address,
  });

  await order.save();

  res.status(201).json({ message: "Order placed", order });
});

module.exports = router;
