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
console.log("[config] ENV_FILE =", envFile, "DEV_ALLOW_PRODUCT_WRITE =", process.env.DEV_ALLOW_PRODUCT_WRITE, "NODE_ENV =", process.env.NODE_ENV || "undefined");

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
// Extra health and env introspection for dev
app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/env", (req, res) => {
  res.json({
    envFile,
    nodeEnv: process.env.NODE_ENV || null,
    devAllowProductWrite: process.env.DEV_ALLOW_PRODUCT_WRITE || null,
    frontendUrl: process.env.FRONTEND_URL || null,
  });
});

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
const marketRoutes = require("./routes/marketRoutes");
app.use("/api/phonepe", phonepeRoutes);
app.use("/api/market", marketRoutes);

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

const startGoldPriceScheduler = require("./scheduler/goldPriceCron");
const { getLatestGoldPrice, refreshForTodayIfNeeded } = require("./services/goldPriceService");
const { repriceAllProducts } = require("./services/productRepriceService");
startGoldPriceScheduler();
(async () => {
  try {
    // Ensure today's rate is present; if cache is from a previous IST day, refresh now.
    await refreshForTodayIfNeeded();

    // Use cached rate if available (no network). If missing, warm in background without failing startup.
    let rates = null;
    try {
      rates = await getLatestGoldPrice({ allowFetch: false });
    } catch { /* no cached rates yet */ }

    if (!rates) {
      setImmediate(async () => {
        try {
          await getLatestGoldPrice({ allowFetch: true });
          console.log("🔄 Gold price warmed on startup");
        } catch (e) {
          console.warn("⛔ Gold price provider unavailable on startup:", e?.message || e);
        }
      });
    }

    // Only reprice synchronously when a rate is already cached
    if (rates) {
      const summary = await repriceAllProducts({ dryRun: false });
      console.log("🧮 Initial product repricing complete:", { updated: summary.updated, inspected: summary.inspected });
    } else {
      console.log("⏭️ Skipping initial reprice (no cached rates). Scheduler will reprice once rates are available.");
    }
  } catch (e) {
    console.warn("⚠️ Startup warm skipped:", e?.message || e);

    // Ensure we still fetch today's price: schedule a few retries in case the provider (e.g., GoldAPI) temporarily rejects (403/429)
    const RETRY_DELAYS_MIN = [10, 30, 60]; // minutes from now
    RETRY_DELAYS_MIN.forEach((min, idx) => {
      setTimeout(async () => {
        try {
          const r = await getLatestGoldPrice({ forceRefresh: true });
          console.log("🔁 Gold price refresh retry succeeded:", {
            source: r.source,
            lastUpdated: r.lastUpdated,
            pricePerGram24kInr: r.pricePerGram24kInr,
            pricePerGram22kInr: r.pricePerGram22kInr,
          });
          try {
            const s = await repriceAllProducts({ dryRun: false });
            console.log("🧮 Repriced after retry:", { updated: s.updated, inspected: s.inspected });
          } catch (e2) {
            console.warn("⚠️ Repricing after retry failed:", e2?.message || e2);
          }
        } catch (err) {
          console.warn(`⏳ Gold price retry #${idx + 1} failed after ${min} min:`, err?.message || err);
        }
      }, min * 60 * 1000);
    });
  }
})();

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
