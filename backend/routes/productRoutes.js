// routes/productRoutes.js
import express from "express";
import { upload } from "../middleware/upload.js";
import Product from "../models/Product.js";

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  const { title, description, category, price } = req.body;
  const newProduct = new Product({
    title,
    description,
    category,
    price,
    image: req.file.filename,
  });
  await newProduct.save();
  res.status(201).json(newProduct);
});

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

export default router;
