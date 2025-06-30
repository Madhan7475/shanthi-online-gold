const User = require('../models/User');

// Register phone-authenticated user (from Firebase)
exports.registerPhoneUser = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    res.status(200).json({ message: 'Phone user registered', user });
  } catch (err) {
    res.status(500).json({ message: 'Error registering phone user', error: err.message });
  }
};

// Register email/password user
exports.registerEmailUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'Email user registered', user });
  } catch (err) {
    res.status(500).json({ message: 'Error registering email user', error: err.message });
  }
};
