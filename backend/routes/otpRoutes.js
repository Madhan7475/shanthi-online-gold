const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const API_KEY = "ce6557bd-598a-11f0-a562-0200cd936042"; // your 2Factor API key

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone is required" });

  try {
    const { data } = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN`
    );
    if (data.Status !== "Success") throw new Error(data.Details);
    res.status(200).json({ sessionId: data.Details });
  } catch (err) {
    console.error("❌ Send OTP failed:", err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp, sessionId, name, email } = req.body;

  if (!phone || !otp || !sessionId)
    return res.status(400).json({ message: "Phone, OTP, and sessionId are required" });

  try {
    const { data } = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (data.Status !== "Success") {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Try finding user by phone or email
    let user = await User.findOne({
      $or: [{ phone }, email ? { email } : null].filter(Boolean),
    });

    if (!user && !email) {
      // OTP is valid, but we need email to merge or create
      return res.status(202).json({ message: "OTP verified, email required", needEmail: true });
    }

    if (!user && email) {
      // New user - create
      user = await User.create({ phone, email, name: name || null });
    } else {
      // Merge: update missing fields
      let updated = false;
      if (!user.phone && phone) {
        user.phone = phone;
        updated = true;
      }
      if (!user.email && email) {
        user.email = email;
        updated = true;
      }
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      if (updated) await user.save();
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ message: "OTP verified", token, user });
  } catch (err) {
    console.error("❌ Verify OTP failed:", err.message);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});



module.exports = router;
