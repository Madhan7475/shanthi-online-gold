const express = require("express");
const { getLatestGoldPrice, getProviderConfig, setGoldPriceManual } = require("../services/goldPriceService");
const adminAuth = require("../middleware/adminAuth");
const { repriceAllProducts } = require("../services/productRepriceService");

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
        return;
    } catch (errCached) {
        // Fallback 1: serve stale disk cache immediately, then refresh in background
        try {
            const fs = require("fs");
            const path = require("path");
            const cachePath = path.join(__dirname, "..", "uploads", "gold_price_cache.json");
            if (fs.existsSync(cachePath)) {
                const raw = fs.readFileSync(cachePath, "utf8");
                const parsed = JSON.parse(raw);
                const payload = parsed && (parsed.data || parsed);
                if (payload && (payload.pricePerGram24kInr || payload.pricePerGram22kInr)) {
                    res.set("Cache-Control", "no-store");
                    res.set("X-Rate-Source", "stale-disk");
                    res.json(payload);
                    // Refresh in background (handles 403/429 transient errors without breaking response)
                    setImmediate(() => {
                        getLatestGoldPrice({ allowFetch: true, forceRefresh: true }).catch(() => { });
                    });
                    return;
                }
            }
        } catch (_) { /* ignore stale read errors */ }

        // Fallback 2: attempt live fetch (blocking) if no cached/stale available
        try {
            const live = await getLatestGoldPrice({ allowFetch: true, forceRefresh: true });
            res.set("Cache-Control", "public, max-age=60");
            res.json(live);
            return;
        } catch (errLive) {
            console.error("❌ Error fetching gold price:", errLive.message || errLive);
            res.status(500).json({ error: "Failed to fetch gold price", details: errLive.message || String(errLive) });
        }
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

/**
 * POST /api/market/admin/gold/set-manual
 * Admin-only: set manual INR/gram rates and optionally reprice products immediately.
 * Body:
 *  {
 *    "pricePerGram24kInr": number,             // required
 *    "pricePerGram22kInr": number | undefined, // optional (defaults to 24k * 22/24)
 *    "reprice": true | false                   // optional, if true triggers repricing
 *  }
 */
router.post("/admin/gold/set-manual", adminAuth, async (req, res) => {
    try {
        const { pricePerGram24kInr, pricePerGram22kInr, pricePerGram18kInr, reprice } = req.body || {};
        const p24 = parseFloat(pricePerGram24kInr);
        const p22 = pricePerGram22kInr != null ? parseFloat(pricePerGram22kInr) : undefined;
        const p18 = pricePerGram18kInr != null ? parseFloat(pricePerGram18kInr) : undefined;

        if (!Number.isFinite(p24)) {
            return res.status(400).json({ error: "pricePerGram24kInr is required and must be a number" });
        }

        const data = setGoldPriceManual({
            pricePerGram24kInr: p24,
            pricePerGram22kInr: p22,
            pricePerGram18kInr: p18,
            source: "Manual-Override",
        });
        AutomatedNotificationService.sendDailyGoldPriceUpdate(data);

        let repriced = null;
        if (String(reprice || "").toLowerCase() === "true") {
            try {
                repriced = await repriceAllProducts({ dryRun: false, allowFetch: false });
            } catch (e) {
                repriced = { error: e?.message || String(e) };
            }
        }

        res.json({ ok: true, data, repriced });
    } catch (err) {
        console.error("❌ Error setting manual gold price:", err?.message || err);
        res.status(500).json({ error: "Failed to set manual gold price", details: err?.message || String(err) });
    }
});

module.exports = router;
