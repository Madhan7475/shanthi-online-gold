const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  product: {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    images: [String],
    category: String,
    karatage: String,
    materialColour: String,
    grossWeight: String,
    metal: String,
  },
}, { timestamps: true });

// Ensure a user can't have duplicate items in wishlist
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
