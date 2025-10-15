// backend/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  // Normalized category slug for fast exact filtering
  categorySlug: { type: String, index: true },
  // Optional link to Category collection for joins/aggregations
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
  price: Number,
  stocks: { type: Number, default: 0 },
  karatage: String,
  materialColour: String,
  grossWeight: String,
  metal: String,
  size: String,
  diamondClarity: String,
  diamondColor: String,
  numberOfDiamonds: String,
  diamondSetting: String,
  diamondShape: String,
  jewelleryType: String,
  brand: String,
  collection: String,
  gender: String,
  occasion: String,
  images: [String],
  makingCharge: { type: mongoose.Schema.Types.ObjectId, ref: "MakingCharge", default: null, index: true },
}, { timestamps: true, suppressReservedKeysWarning: true });

// Indexes to accelerate backend filtering via query params
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ jewelleryType: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ karatage: 1 });
productSchema.index({ metal: 1 });
productSchema.index({ diamondClarity: 1 });
productSchema.index({ collection: 1 });
// Helpful compound indexes for common facets
productSchema.index({ categorySlug: 1, gender: 1 });
productSchema.index({ categorySlug: 1, karatage: 1 });
productSchema.index({ categorySlug: 1, price: 1 });

// ✅ CORRECT EXPORT
module.exports = mongoose.model("Product", productSchema);
