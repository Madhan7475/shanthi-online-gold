const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/users/register
// @desc    Register a new user (email or phone required)
router.post('/register', async (req, res) => {
  console.log("📩 Incoming Register Request:", req.body); // <-- Log incoming body

  const { name, email, phone, password } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({
      error: 'Name, password, and either email or phone are required'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      console.log("⚠️ Duplicate User Found:", existingUser);
      return res.status(400).json({
        error: 'User already registered with this email or phone number'
      });
    }

    const user = new User({ name, email, phone, password });
    await user.save();

    console.log("✅ New User Registered:", user._id);

    res.status(201).json({
      message: '✅ User registered successfully',
      userId: user._id
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({
      error: '❌ Server error',
      details: error.message
    });
  }
});

// @route   POST /api/users/login
// @desc    Login user via email or phone + password
router.post('/login', async (req, res) => {
  console.log("📩 Incoming Login Request:", req.body); // <-- Log incoming body

  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    return res.status(400).json({
      error: 'Email or phone and password are required'
    });
  }

  try {
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      console.log("❌ User not found with:", query);
      return res.status(400).json({ error: '❌ Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", user._id);
      return res.status(400).json({ error: '❌ Invalid credentials' });
    }

    console.log("✅ Login successful for:", user._id);

    res.status(200).json({
      message: '✅ Login successful',
      userId: user._id,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({
      error: '❌ Server error',
      details: error.message
    });
  }
});

module.exports = router;
