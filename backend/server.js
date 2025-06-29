const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === MongoDB Connection ===
mongoose.connect("mongodb://localhost:27017/shanthi-gold", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

// === Mongoose Models ===
const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  price: Number,
  images: [String],
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  customerName: String,
  total: Number,
  status: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

// === Multer Config ===
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

// === Product Routes ===

// Upload product
app.post("/api/products", upload.array("images", 10), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const imagePaths = req.files.map(file => file.filename);

    const product = new Product({ title, description, category, price, images: imagePaths });
    await product.save();

    res.status(201).json({ message: "Product uploaded successfully!", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading product" });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Update product
app.put("/api/products/:id", async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { title, description, category, price },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating product" });
  }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete images
    product.images.forEach((img) => {
      const imgPath = path.join(__dirname, "uploads", img);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

// === Order Routes ===

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Update order status
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating order" });
  }
});

// === Start Server ===
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
