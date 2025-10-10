const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load environment-specific .env file
const envFile = process.env.ENV_FILE || '.env';
dotenv.config({ path: envFile });

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Parse CORS origins from environment variable (comma-separated)
const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = corsOriginEnv
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

console.log('CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS policy'), false);
      }
    },
    credentials: true, // required if frontend sends cookies/auth headers
  })
);

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Health check
app.get("/", (req, res) => res.send("🟢 Backend is running"));

// Import and mount routes
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");

const phonepeRoutes = require("./routes/phonepeRoutes");
app.use("/api/phonepe", phonepeRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack || err);
  res.status(500).json({ message: "Server error", error: err.message || err });
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
