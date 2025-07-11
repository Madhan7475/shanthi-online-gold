const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    default: null, // optional but useful for Google login
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
