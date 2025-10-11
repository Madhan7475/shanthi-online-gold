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

function scheduleShortRetries() {
    const delaysMin = [10, 30, 60]; // retry after 10, 30, 60 minutes
    delaysMin.forEach((min, idx) => {
        setTimeout(async () => {
            try {
                await runRefresh();
            } catch (e) {
                console.warn(`⏳ Scheduled gold price retry #${idx + 1} failed after ${min} min:`, e?.message || e);
            }
        }, min * 60 * 1000);
    });
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
        
        // Product repricing
        try {
            const summary = await repriceAllProducts({ dryRun: false });
            console.log("🧮 Products repriced:", { updated: summary.updated, inspected: summary.inspected });
        } catch (e) {
            console.error("⚠️ Product repricing after refresh failed:", e?.message || e);
        }
        
        // Send gold price notifications
        try {
            const AutomatedNotificationService = require("../services/AutomatedNotificationService");
            console.log("📱 Triggering gold price notifications...");
            const notificationResult = await AutomatedNotificationService.sendDailyGoldPriceUpdate();
            console.log("📊 Gold price notifications result:", {
                sent: notificationResult.sent,
                failed: notificationResult.failed,
                price24k: notificationResult.currentPrice24k,
                price22k: notificationResult.currentPrice22k
            });
        } catch (e) {
            console.error("⚠️ Gold price notifications failed:", e?.message || e);
        }
        
    } catch (err) {
        console.error("❌ Scheduled gold price refresh failed:", err.message || err);
        // If provider (e.g., GoldAPI) rejects (403/429) or network fails, try short backoff retries
        scheduleShortRetries();
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
