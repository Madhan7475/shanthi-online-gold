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

/**
 * CORS
 * - CORS_ORIGIN can be a comma-separated list of exact URLs or patterns with *
 *   e.g. https://your-app.vercel.app,https://*.vercel.app,http://localhost:5173
 */
let corsOriginConfig = true; // default allow all (useful for local/dev)
if (process.env.CORS_ORIGIN) {
  const patterns = process.env.CORS_ORIGIN
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const toRegex = (pattern) => {
    // escape regex special chars except '*', then turn '*' into '.*'
    const escaped = pattern
      .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  };

  const regexes = patterns.map(toRegex);

  corsOriginConfig = function (origin, callback) {
    // Allow non-browser clients with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (regexes.some((rx) => rx.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  };
}

app.use(cors({
  origin: corsOriginConfig,
  credentials: true
}));

/**
 * Ensure uploads directory exists (works locally and on Render disk mount)
 */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// === Middleware ===
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// === Import Routes ===
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const otpRoutes = require('./routes/otpRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // ✅ Import payment routes

/**
 * Health check endpoints
 * - "/" simple text (legacy)
 * - "/healthz" JSON with minimal runtime info for Render health checks
 */
app.get("/", (req, res) => {
  res.send("🟢 Backend is running");
});

app.get("/healthz", (req, res) => {
  try {
    const mongoState = (() => {
      try {
        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        return require("mongoose").connection.readyState;
      } catch {
        return -1; // mongoose not available (shouldn't happen)
      }
    })();

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      mongo: mongoState,
    });
  } catch (e) {
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
