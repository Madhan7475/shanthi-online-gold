const express = require("express");
const Product = require("../models/Product");
const { upload } = require("../middleware/upload");

const router = express.Router();

/**
 * @route   POST /api/products
 * @desc    Upload a new product with multiple images
 * @access  Public
 */
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const {
      title, description, category, price, karatage, materialColour,
      grossWeight, metal, size, diamondClarity, diamondColor, numberOfDiamonds,
      diamondSetting, diamondShape, jewelleryType, brand, collection,
      gender, occasion
    } = req.body;

    const imageFilenames = req.files?.map((file) => file.filename) || [];

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
 * @access  Public
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

/**
 * @route   GET /api/products/:id
 * @desc    Fetch single product by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("❌ Error fetching product by ID:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

module.exports = router;
