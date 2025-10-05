// backend/services/productRepriceService.js
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const { getLatestGoldPrice } = require("./goldPriceService");

const SNAPSHOT_FILE = path.join(__dirname, "..", "uploads", "product_reprice_last.json");

function ensureDir(p) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseGrossWeight(grossWeight) {
    if (grossWeight == null) return null;
    // grossWeight is a String in schema; try to extract numeric part (grams)
    if (typeof grossWeight === "number") return grossWeight;
    const match = String(grossWeight).replace(",", ".").match(/([0-9]*\.?[0-9]+)/);
    if (!match) return null;
    const val = parseFloat(match[1]);
    return isFinite(val) ? val : null;
}

function parseKarat(karatage) {
    if (!karatage) return null;
    const s = String(karatage).toUpperCase().trim();
    // Accept formats like "22K", "22 KT", "22Kt", "22", "18k", etc.
    const m = s.match(/([0-9]{2})\s*K|([0-9]{2})\s*KT|^([0-9]{2})$/i);
    if (m) {
        const k = parseInt(m[1] || m[2] || m[3], 10);
        if ([24, 23, 22, 21, 20, 18].includes(k)) return k;
        if (k > 0 && k <= 24) return k;
    }
    // Common aliases
    if (s.includes("24")) return 24;
    if (s.includes("22")) return 22;
    if (s.includes("18")) return 18;
    return null;
}

function rateForKarat(karat, pricePerGram24kInr, pricePerGram22kInr) {
    if (!pricePerGram24kInr) throw new Error("Missing 24K reference price");
    if (karat === 24) return pricePerGram24kInr;
    if (karat === 22 && pricePerGram22kInr) return pricePerGram22kInr;
    // Generic conversion using proportion of purity
    if (typeof karat === "number" && karat > 0 && karat <= 24) {
        return pricePerGram24kInr * (karat / 24);
    }
    // Default to 22K if unknown and 22K is available, else 24K
    return pricePerGram22kInr || pricePerGram24kInr;
}

function computePrice(grossWeightGrams, karat, rates) {
    const { pricePerGram24kInr, pricePerGram22kInr } = rates;
    const perGram = rateForKarat(karat, pricePerGram24kInr, pricePerGram22kInr);
    const price = grossWeightGrams * perGram;
    // Round to nearest rupee
    return Math.round(price);
}

function writeSnapshot(summary) {
    try {
        ensureDir(SNAPSHOT_FILE);
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(summary, null, 2), "utf8");
    } catch (e) {
        console.warn("⚠️ Failed to write reprice snapshot:", e.message || e);
    }
}

/**
 * Reprice all products based on today's cached gold rates and each product's
 * - grossWeight (grams)
 * - karatage (e.g., "22K", "24K", "18K")
 *
 * By default, persists to MongoDB (updates Product.price). If dryRun=true, only returns a summary.
 */
async function repriceAllProducts({ dryRun = false } = {}) {
    // Do NOT fetch provider here; we rely on cached rates for today.
    const rates = await getLatestGoldPrice({ allowFetch: false });
    const { pricePerGram24kInr, pricePerGram22kInr, lastUpdated, source } = rates;

    const cursor = Product.find({}, { title: 1, price: 1, grossWeight: 1, karatage: 1 }).cursor();

    let inspected = 0;
    let updated = 0;
    let skippedNoWeight = 0;
    let skippedNoKarat = 0;
    let unchanged = 0;

    const sampleChanges = [];
    const bulkOps = [];
    const BATCH = 500;

    for await (const p of cursor) {
        inspected++;
        const weight = parseGrossWeight(p.grossWeight);
        if (weight == null || !isFinite(weight) || weight <= 0) {
            skippedNoWeight++;
            continue;
        }
        const karat = parseKarat(p.karatage) ?? 22; // default to 22K if missing
        if (!karat) {
            skippedNoKarat++;
            continue;
        }

        const newPrice = computePrice(weight, karat, { pricePerGram24kInr, pricePerGram22kInr });
        if (!Number.isFinite(newPrice)) {
            skippedNoWeight++;
            continue;
        }

        if (dryRun || p.price !== newPrice) {
            if (!dryRun) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: p._id },
                        update: { $set: { price: newPrice } },
                    },
                });
            }
            updated++;
            if (sampleChanges.length < 10) {
                sampleChanges.push({
                    id: String(p._id),
                    title: p.title,
                    karatage: p.karatage,
                    grossWeight: p.grossWeight,
                    oldPrice: p.price,
                    newPrice,
                });
            }
        } else {
            unchanged++;
        }

        if (!dryRun && bulkOps.length >= BATCH) {
            await Product.bulkWrite(bulkOps);
            bulkOps.length = 0;
        }
    }

    if (!dryRun && bulkOps.length) {
        await Product.bulkWrite(bulkOps);
    }

    const summary = {
        timestamp: new Date().toISOString(),
        source,
        goldRates: {
            pricePerGram24kInr,
            pricePerGram22kInr,
            lastUpdated,
        },
        inspected,
        updated,
        unchanged,
        skippedNoWeight,
        skippedNoKarat,
        dryRun,
        sampleChanges,
    };

    writeSnapshot(summary);

    return summary;
}

module.exports = {
    repriceAllProducts,
};
