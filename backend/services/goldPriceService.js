const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TROY_OUNCE_IN_GRAMS = 31.1034768;
const TTL_MIN = parseInt(process.env.GOLD_PRICE_TTL_MINUTES || "5", 10);
const TTL_MS = Math.max(TTL_MIN, 1) * 60 * 1000;

// Optional adjustments (all percentages except local premium which is absolute INR/gram)
const IMPORT_DUTY_PCT = parseFloat(process.env.GOLD_IMPORT_DUTY_PCT || "0");
const GST_PCT = parseFloat(process.env.GOLD_GST_PCT || "0");
const LOCAL_PREMIUM_PER_G = parseFloat(process.env.GOLD_LOCAL_PREMIUM_PER_G || "0");
const MARGIN_PCT = parseFloat(process.env.GOLD_MARGIN_PCT || "0");

// Providers
const METALS_API_URL = process.env.METALS_API_URL || "https://metals-api.com/api";
const METALS_API_KEY = process.env.METALS_API_KEY || "";

const GOLDAPI_URL = process.env.GOLDAPI_URL || "https://www.goldapi.io/api/XAU/INR";
const GOLDAPI_KEY = process.env.GOLDAPI_KEY || "";

// Simple in-memory cache
let cache = {
    data: null,
    fetchedAt: 0,
    source: null,
};

const CACHE_FILE = path.join(__dirname, "..", "uploads", "gold_price_cache.json");

function loadCacheFromDisk() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, "utf8");
            const parsed = JSON.parse(raw);
            const fetchedAtMs = (typeof parsed.fetchedAt === "number")
                ? parsed.fetchedAt
                : (typeof parsed.fetchedAt === "string" ? Date.parse(parsed.fetchedAt) : 0);
            if (parsed && parsed.data && fetchedAtMs) {
                cache = {
                    data: parsed.data,
                    fetchedAt: fetchedAtMs,
                    source: parsed.data.source || parsed.source || null,
                };
                console.log("💾 Loaded gold price cache from disk:", {
                    source: cache.source,
                    fetchedAt: new Date(cache.fetchedAt).toISOString(),
                });
            }
        }
    } catch (e) {
        console.warn("⚠️ Failed to load gold price cache from disk:", e.message || e);
    }
}

function persistCacheToDisk() {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(
            CACHE_FILE,
            JSON.stringify({ data: cache.data, fetchedAt: cache.fetchedAt, source: cache.source }, null, 2),
            "utf8"
        );
    } catch (e) {
        console.warn("⚠️ Failed to persist gold price cache to disk:", e.message || e);
    }
}

loadCacheFromDisk();

function isSameISTDate(aMs, bMs) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const a = new Date(aMs + IST_OFFSET_MS);
    const b = new Date(bMs + IST_OFFSET_MS);
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

async function refreshForTodayIfNeeded() {
    const now = Date.now();
    if (!cache.data || !isSameISTDate(now, cache.fetchedAt)) {
        await getLatestGoldPrice({ forceRefresh: true });
    }
}

function applyAdjustments(pricePerGramInr) {
    // Order of operations is configurable; here we apply duty -> premium -> margin -> GST
    let p = pricePerGramInr;
    if (IMPORT_DUTY_PCT) p = p * (1 + IMPORT_DUTY_PCT / 100);
    if (LOCAL_PREMIUM_PER_G) p = p + LOCAL_PREMIUM_PER_G;
    if (MARGIN_PCT) p = p * (1 + MARGIN_PCT / 100);
    if (GST_PCT) p = p * (1 + GST_PCT / 100);
    return p;
}

function normalizeOutput({ perGram24kInr, perGram22kInr, perGram18kInr, source }) {
    const adj24 = applyAdjustments(perGram24kInr);
    const adj22 = applyAdjustments(perGram22kInr);
    const basis18 = perGram18kInr != null ? perGram18kInr : (perGram24kInr * (18 / 24));
    const adj18 = applyAdjustments(basis18);
    const now = new Date();
    return {
        pricePerGram24kInr: Number(adj24.toFixed(2)),
        pricePerGram22kInr: Number(adj22.toFixed(2)),
        pricePerGram18kInr: Number(adj18.toFixed(2)),
        currency: "INR",
        unit: "GRAM",
        lastUpdated: now.toISOString(),
        source,
        ttlSeconds: Math.floor(TTL_MS / 1000),
    };
}

async function fetchFromMetalsApi() {
    if (!METALS_API_KEY) {
        throw new Error("Metals-API key missing (set METALS_API_KEY)");
    }

    // Free tier: usually USD base. Request USD→INR and USD→XAU.
    const url = `${METALS_API_URL.replace(/\/$/, "")}/latest`;
    const params = {
        access_key: METALS_API_KEY,
        symbols: "XAU,INR",
    };

    const { data } = await axios.get(url, { params });
    if (data?.success === false) {
        const info = data?.error?.info || "Unknown error from Metals-API";
        const code = data?.error?.type || data?.error?.code || "unknown";
        throw new Error(`Metals-API error (${code}): ${info}`);
    }

    const rates = data?.rates || {};
    const rateINR = rates.INR;
    const rateXAU = rates.XAU; // USD→XAU (XAU per 1 USD)

    if (!rateINR || !rateXAU) {
        throw new Error("Metals-API response missing INR or XAU rates");
    }

    // Convert to INR per XAU (troy ounce), then per gram
    const inrPerXau = rateINR / rateXAU;
    const perGram24 = inrPerXau / TROY_OUNCE_IN_GRAMS;
    const perGram22 = perGram24 * (22 / 24);
    const perGram18 = perGram24 * (18 / 24);

    return normalizeOutput({
        perGram24kInr: perGram24,
        perGram22kInr: perGram22,
        perGram18kInr: perGram18,
        source: "Metals-API",
    });
}

async function fetchFromGoldApi() {
    if (!GOLDAPI_KEY) {
        throw new Error("GoldAPI.io key missing (set GOLDAPI_KEY)");
    }

    const headers = {
        "x-access-token": GOLDAPI_KEY,
        "Content-Type": "application/json",
    };

    // Debug logging (token masked)
    console.log("🌐 GoldAPI URL:", GOLDAPI_URL);
    console.log("🔐 GoldAPI headers:", { "x-access-token": GOLDAPI_KEY ? GOLDAPI_KEY.slice(0, 8) + "..." : "missing" });
    const { data } = await axios.get(GOLDAPI_URL, { headers });

    // GoldAPI typically returns price_gram_24k and price_gram_22k
    let perGram24 = data?.price_gram_24k;
    let perGram22 = data?.price_gram_22k;

    // Fallback if only ounce price is available
    if (!perGram24 && typeof data?.price === "number") {
        perGram24 = data.price / TROY_OUNCE_IN_GRAMS;
    }
    if (!perGram22 && perGram24) {
        perGram22 = perGram24 * (22 / 24);
    }
    const perGram18 = perGram24 ? perGram24 * (18 / 24) : null;

    if (!perGram24 || !perGram22) {
        throw new Error("GoldAPI.io response missing gram prices");
    }

    return normalizeOutput({
        perGram24kInr: perGram24,
        perGram22kInr: perGram22,
        perGram18kInr: perGram18,
        source: "GoldAPI.io",
    });
}

async function getLatestGoldPrice({ forceRefresh = false, allowFetch = true } = {}) {
    const now = Date.now();
    const sameDay = cache.data ? isSameISTDate(now, cache.fetchedAt) : false;
    if (!allowFetch) {
        if (cache.data && (now - cache.fetchedAt < TTL_MS) && sameDay) {
            return cache.data;
        }
        throw new Error("Gold price not available. Await scheduled refresh at 12:00 Asia/Kolkata.");
    }
    if (!forceRefresh && cache.data && (now - cache.fetchedAt < TTL_MS) && sameDay) {
        return cache.data;
    }

    let result;
    let lastErr;

    // Preference: Metals-API first if key present
    if (METALS_API_KEY) {
        try {
            result = await fetchFromMetalsApi();
        } catch (err) {
            lastErr = err;
            // console.warn("Metals-API fetch failed:", err.message);
        }
    }

    // Fallback to GoldAPI if needed
    if (!result && GOLDAPI_KEY) {
        try {
            result = await fetchFromGoldApi();
        } catch (err) {
            lastErr = err;
            // console.warn("GoldAPI.io fetch failed:", err.message);
        }
    }

    if (!result) {
        // Service-level fallback: if providers failed (e.g., 403/429), try serving stale disk cache
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const raw = fs.readFileSync(CACHE_FILE, "utf8");
                const parsed = JSON.parse(raw);
                const fallback = parsed && (parsed.data || parsed);
                if (fallback && (fallback.pricePerGram24kInr || fallback.pricePerGram22kInr)) {
                    // Keep in-memory cache coherent for downstream reads
                    cache = {
                        data: fallback,
                        fetchedAt: cache.fetchedAt || Date.now(),
                        source: fallback.source || cache.source || null,
                    };
                    return fallback;
                }
            }
        } catch (_) { /* ignore stale read errors */ }
        throw lastErr || new Error("No gold price provider configured. Set METALS_API_KEY or GOLDAPI_KEY.");
    }

    cache = {
        data: result,
        fetchedAt: Date.now(),
        source: result.source,
    };
    persistCacheToDisk();

    return result;
}

function setGoldPriceManual({ pricePerGram24kInr, pricePerGram22kInr, pricePerGram18kInr, source = "Manual-Override" } = {}) {
    const p24 = Number(pricePerGram24kInr);
    if (!Number.isFinite(p24)) {
        throw new Error("pricePerGram24kInr is required and must be a number");
    }
    let p22 = pricePerGram22kInr != null ? Number(pricePerGram22kInr) : (p24 * (22 / 24));
    if (!Number.isFinite(p22)) {
        p22 = p24 * (22 / 24);
    }
    let p18 = pricePerGram18kInr != null ? Number(pricePerGram18kInr) : (p24 * (18 / 24));
    if (!Number.isFinite(p18)) {
        p18 = p24 * (18 / 24);
    }
    const result = {
        pricePerGram24kInr: Number(p24.toFixed(2)),
        pricePerGram22kInr: Number(p22.toFixed(2)),
        pricePerGram18kInr: Number(p18.toFixed(2)),
        currency: "INR",
        unit: "GRAM",
        lastUpdated: new Date().toISOString(),
        source,
        ttlSeconds: Math.floor(TTL_MS / 1000),
    };
    cache = {
        data: result,
        fetchedAt: Date.now(),
        source: result.source,
    };
    persistCacheToDisk();
    return result;
}

function getProviderConfig() {
    return {
        goldApiUrl: GOLDAPI_URL,
        goldApiKeyMasked: GOLDAPI_KEY ? GOLDAPI_KEY.slice(0, 8) + "..." : null,
        metalsApiUrl: METALS_API_URL,
        hasMetalsKey: !!METALS_API_KEY,
        ttlSeconds: Math.floor(TTL_MS / 1000),
    };
}

module.exports = {
    getLatestGoldPrice,
    getProviderConfig,
    refreshForTodayIfNeeded,
    setGoldPriceManual,
};
