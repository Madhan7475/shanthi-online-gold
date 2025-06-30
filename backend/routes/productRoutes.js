// routes/productRoutes.js
const express = require("express");
const Product = require("../models/Product");
const { upload } = require("../middleware/upload");

const router = express.Router();

/**
 * @route   POST /api/products
 * @desc    Upload a new product with multiple images
 * @access  Public (can be secured later)
 */
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const {
      title, description, category, price, karatage, materialColour,
      grossWeight, metal, size, diamondClarity, diamondColor, numberOfDiamonds,
      diamondSetting, diamondShape, jewelleryType, brand, collection,
      gender, occasion
    } = req.body;

    // Extract uploaded image filenames
    const imageFilenames = req.files?.map((file) => file.filename) || [];

    // Create a new Product instance
    const newProduct = new Product({
      title,
      description,
      category,
      price,
      karatage,
      materialColour,
      grossWeight,
      metal,
      size,
      diamondClarity,
      diamondColor,
      numberOfDiamonds,
      diamondSetting,
      diamondShape,
      jewelleryType,
      brand,
      collection,
      gender,
      occasion,
      images: imageFilenames,
    });

    // Save to MongoDB
    await newProduct.save();

    res.status(201).json({
      message: "✅ Product uploaded successfully",
      product: newProduct
    });
  } catch (err) {
    console.error("❌ Error uploading product:", err);
    res.status(500).json({
      error: "Failed to upload product",
      details: err.message,
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Fetch all products
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;
