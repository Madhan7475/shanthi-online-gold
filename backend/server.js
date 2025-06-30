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

// Initialize express app
const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Multer Config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Product Upload Route (only for image upload) ===
const Product = require('./models/Product');
app.post('/api/upload-product', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const images = req.files.map(file => file.filename);

    const product = new Product({ title, description, category, price, images });
    await product.save();

    res.status(201).json({ message: 'Product uploaded successfully!', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading product' });
  }
});

// === Import Routes ===
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// === Use Routes ===
app.use('/api/users', userRoutes);          // /api/users/register, /api/users/login
app.use('/api/products', productRoutes);    // GET/PUT/DELETE products
app.use('/api/orders', orderRoutes);        // Order routes

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
