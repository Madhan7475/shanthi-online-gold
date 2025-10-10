const { getLatestGoldPrice, getProviderConfig } = require("../services/goldPriceService");
const { repriceAllProducts } = require("../services/productRepriceService");

/**
 * Dependency-free daily scheduler to refresh gold price exactly at 12:00 PM IST.
 * Avoids external cron libs so we never hit registry/network issues.
 */

function msUntilNextNoonIST() {
    // IST offset is UTC+5:30 (no DST in India)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const nowUtc = Date.now();
    const nowIst = new Date(nowUtc + IST_OFFSET_MS);

    // Build today's 12:00:00.000 IST
    const targetIst = new Date(nowIst);
    targetIst.setHours(12, 0, 0, 0);

    // If we've passed today's noon IST, schedule for tomorrow
    if (nowIst >= targetIst) {
        targetIst.setDate(targetIst.getDate() + 1);
    }

    // Convert target back to UTC milliseconds and compute delay
    const targetUtcMs = targetIst.getTime() - IST_OFFSET_MS;
    const delayMs = targetUtcMs - nowUtc;

    // Safety: ensure non-negative delay
    return Math.max(delayMs, 0);
}

async function runRefresh() {
    try {
        const cfg = getProviderConfig();
        console.log(`⏰ Running scheduled gold price refresh @ 12:00 (Asia/Kolkata) via ${cfg.goldApiUrl}`);
        const data = await getLatestGoldPrice({ forceRefresh: true });
        console.log("✅ Gold price refreshed:", {
            source: data.source,
            pricePerGram24kInr: data.pricePerGram24kInr,
            pricePerGram22kInr: data.pricePerGram22kInr,
            lastUpdated: data.lastUpdated,
        });
        try {
            const summary = await repriceAllProducts({ dryRun: false });
            console.log("🧮 Products repriced:", { updated: summary.updated, inspected: summary.inspected });
        } catch (e) {
            console.error("⚠️ Product repricing after refresh failed:", e?.message || e);
        }
    } catch (err) {
        console.error("❌ Scheduled gold price refresh failed:", err.message || err);
    }
}

function startGoldPriceScheduler() {
    const tz = process.env.CRON_TZ || "Asia/Kolkata";

    function scheduleNext() {
        const delay = msUntilNextNoonIST();
        const hrs = Math.round((delay / 3600000) * 100) / 100;
        console.log(`🗓️ Scheduled daily gold price refresh at 12:00 (${tz}). Next run in ~${hrs} hours.`);
        setTimeout(async () => {
            await runRefresh();
            scheduleNext(); // schedule the subsequent day
        }, delay);
    }

    scheduleNext();
}

module.exports = startGoldPriceScheduler;
