const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
  },
  email: {
    type: String,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Email is invalid'],
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
}, {
  timestamps: true,
});

// ✅ Ensure at least email or phone is provided
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Either email or phone must be provided');
    this.invalidate('phone', 'Either email or phone must be provided');
  }
  next();
});

// 🔐 Hash password before saving, only if it's modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔐 Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
