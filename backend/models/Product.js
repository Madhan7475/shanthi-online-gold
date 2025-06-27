const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Optional: delete old images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      product.images.forEach((img) => {
        const filePath = path.join(__dirname, "..", "uploads", img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      product.images = req.files.map((file) => file.filename);
    }

    product.title = title;
    product.description = description;
    product.price = price;
    product.category = category;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Edit failed" });
  }
});
