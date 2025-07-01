// backend/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  price: Number,
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
}, { timestamps: true });

// ✅ CORRECT EXPORT
module.exports = mongoose.model("Product", productSchema);
