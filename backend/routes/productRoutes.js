// routes/productRoutes.js
const express = require("express");
const Product = require("../models/Product");
const { upload } = require("../middleware/upload");

const router = express.Router();

// POST: Upload a single product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;

    const newProduct = new Product({
      title,
      description,
      category,
      price,
      images: [req.file.filename] // Keeping consistent as array
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error uploading product:", err);
    res.status(500).json({ error: "Failed to upload product" });
  }
});

// GET: All products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;
