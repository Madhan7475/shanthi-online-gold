// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express(); // ✅ This must come BEFORE you use `app`

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/shanthi-gold", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Mongoose Product Schema
const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  price: Number,
  images: [String],
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// Multer Storage for Multiple Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes
app.post("/api/products", upload.array("images", 10), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const imagePaths = req.files.map(file => file.filename);

    const product = new Product({
      title,
      description,
      category,
      price,
      images: imagePaths,
    });

    await product.save();
    res.status(201).json({ message: "Product uploaded successfully!", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading product" });
  }
});

app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.images.forEach((img) => {
      const imgPath = path.join(__dirname, "uploads", img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
