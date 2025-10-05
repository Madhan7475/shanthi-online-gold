const express = require("express");
const { getLatestGoldPrice, getProviderConfig } = require("../services/goldPriceService");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/**
 * GET /api/market/gold/price
 * Public endpoint returning normalized INR/gram prices (24K and 22K)
 * Response:
 * {
 *   pricePerGram24kInr: number,
 *   pricePerGram22kInr: number,
 *   currency: "INR",
 *   unit: "GRAM",
 *   lastUpdated: ISOString,
 *   source: "GoldAPI.io" | "Metals-API",
 *   ttlSeconds: number
 * }
 */
router.get("/gold/price", async (req, res) => {
    try {
        const data = await getLatestGoldPrice({ allowFetch: false });
        // Cache hint for clients/CDN; backend has a separate TTL cache
        res.set("Cache-Control", "public, max-age=60");
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching gold price:", err.message || err);
        res.status(500).json({ error: "Failed to fetch gold price", details: err.message || String(err) });
    }
});

/**
 * POST /api/market/admin/gold/refresh
 * Admin-only endpoint to force refresh the cached rates immediately.
 */
router.post("/admin/gold/refresh", adminAuth, async (req, res) => {
    try {
        const data = await getLatestGoldPrice({ forceRefresh: true });
        res.json({ refreshed: true, ...data });
    } catch (err) {
        console.error("❌ Error refreshing gold price:", err.message || err);
        res.status(500).json({ error: "Failed to refresh gold price", details: err.message || String(err) });
    }
});

/**
 * GET /api/market/config
 * Returns current provider configuration (keys masked) for debugging.
 */
router.get("/config", (req, res) => {
    try {
        const cfg = getProviderConfig();
        res.json(cfg);
    } catch (err) {
        res.status(500).json({ error: "Failed to read provider config", details: err.message || String(err) });
    }
});

module.exports = router;
