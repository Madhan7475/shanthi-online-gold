const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// === Load environment variables ===
dotenv.config({ path: path.resolve(__dirname, '.env') });

// === Connect to MongoDB ===
connectDB();

// === Import Routes ===
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // only ONE import

// === Initialize Express app ===
const app = express();

// === CORS configuration ===
let corsOriginConfig = true; // allow all by default
if (process.env.CORS_ORIGIN) {
  const patterns = process.env.CORS_ORIGIN
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const toRegex = (pattern) => {
    const escaped = pattern
      .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  };

  const regexes = patterns.map(toRegex);

  corsOriginConfig = function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (regexes.some((rx) => rx.test(origin))) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  };
}

app.use(cors({ origin: corsOriginConfig, credentials: true }));

// === Ensure uploads directory exists ===
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// === Middleware ===
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// === Health check endpoints ===
app.get("/", (req, res) => res.send("🟢 Backend is running"));

app.get("/healthz", (req, res) => {
  try {
    const mongoState = (() => {
      try { return require("mongoose").connection.readyState; } 
      catch { return -1; }
    })();
    res.status(200).json({ status: "ok", uptime: process.uptime(), mongo: mongoState });
  } catch {
    res.status(200).json({ status: "ok" });
  }
});

// === Use Routes ===
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', otpRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment', paymentRoutes);

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.stack || err);
  res.status(500).json({ message: 'Server error', error: err.message || err });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🟢 PhonePe Mode: ${process.env.PHONEPE_ENV || 'sandbox'}`);
  console.log(`🔗 Base URL: ${process.env.PHONEPE_ENV === 'production'
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'}`);
});
