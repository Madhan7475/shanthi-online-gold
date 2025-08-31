const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

/**
 * Load environment variables from backend/.env regardless of cwd
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// === CORS ===
app.use(cors({
  origin: true, // Allow all origins for temporary public tunnel (dummy hosting)
  credentials: true
}));

// === Middleware ===
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Import Routes ===
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // ✅ Import payment routes

// === Root route for health check ===
app.get("/", (req, res) => {
  res.send("🟢 Backend is running");
});

// === Use Routes ===
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment', paymentRoutes); // ✅ Use payment routes

// === Global Error Handler (optional) ===
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
