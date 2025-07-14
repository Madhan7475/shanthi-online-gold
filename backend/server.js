const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Multer Config (for product images) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// === Product Upload Endpoint ===
const Product = require('./models/Product');
app.post('/api/upload-product', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const images = req.files.map(file => file.filename);

    const newProduct = new Product({ title, description, category, price, images });
    await newProduct.save();

    res.status(201).json({ message: '✅ Product uploaded successfully!', product: newProduct });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: '❌ Failed to upload product.' });
  }
});

// === Import Routes ===
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes'); // 🧾 Invoices

// === Use Routes ===
app.use('/api/users', userRoutes);        // /register, /login
app.use('/api/products', productRoutes);  // GET, PUT, DELETE
app.use('/api/orders', orderRoutes);      // Order CRUD
app.use('/api/invoices', invoiceRoutes);  // Invoices API

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
