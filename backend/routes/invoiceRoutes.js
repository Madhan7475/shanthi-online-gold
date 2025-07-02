const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private/Admin
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
