const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

const path = require("path");
const dotenv = require("dotenv");
// Reload .env at runtime so new keys take effect without a full server restart
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

// === Read credentials from .env ===
const PHONEPE_ENV = process.env.PHONEPE_ENV || "sandbox"; // "sandbox" or "production"
const PHONEPE_BASE_URL =
  PHONEPE_ENV === "production"
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

const PHONEPE_PAY_ENDPOINT = "/pg/v1/pay";
const PHONEPE_PAY_ENDPOINT_ALT = "/v1/pay"; // fallback for API mapping variants

function getPhonepeBaseUrl() {
  const env = (process.env.PHONEPE_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.phonepe.com/apis"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_KEY_INDEX = process.env.PHONEPE_KEY_INDEX || "1";

if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
  console.error("❌ PhonePe credentials missing: set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in backend/.env");
}

// Fallback URLs if .env is not configured
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";

console.log(`🟢 PhonePe ${PHONEPE_ENV.toUpperCase()} Mode Enabled`);
console.log("Client ID:", PHONEPE_CLIENT_ID);

// === Fake auth for testing ===
const fakeAuth = (req, res, next) => {
  req.user = { uid: "test_user_1" };
  next();
};

/**
 * POST /api/payment/create-order
 * Create a PhonePe order
 */
router.post("/create-order", fakeAuth, async (req, res) => {
  // Read latest env at request time (after dotenv override above)
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const keyIndex = process.env.PHONEPE_KEY_INDEX || "1";

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: {
        code: "CONFIG_MISSING",
        message:
          "Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in backend/.env (and PHONEPE_KEY_INDEX if provided by PhonePe).",
      },
    });
  }

  const { amount = 100, orderData = {} } = req.body; // amount in INR
  const merchantTransactionId = "txn_" + Date.now();

  try {
    const payload = {
      merchantId: clientId,
      merchantTransactionId,
      merchantUserId: req.user.uid,
      amount: amount * 100, // paise
      redirectUrl: `${FRONTEND_URL}/payment-success`,
      redirectMode: "REDIRECT",
      callbackUrl: `${BACKEND_URL}/api/payment/phonepe/callback`,
      mobileNumber: orderData.customer?.phone || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    console.log("📦 Payload before base64:", payload);

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    // Helper to post to PhonePe with dynamic path and correct checksum/header per path
    async function postToPhonePe(payPath) {
      const checksum = crypto
        .createHash("sha256")
        .update(payloadBase64 + payPath + clientSecret)
        .digest("hex");

      const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": `${checksum}###${keyIndex}`,
        "X-MERCHANT-ID": clientId,
      };

      const url = `${getPhonepeBaseUrl()}${payPath}`;
      console.log("🔐 Headers:", headers);
      console.log("🟡 PhonePe Pay URL:", url);

      return axios.post(url, { request: payloadBase64 }, { headers });
    }

    const candidates = [PHONEPE_PAY_ENDPOINT, "/hermes/pg/v1/pay", "/v1/pay"];
    let response;
    let lastErr;
    for (const p of candidates) {
      try {
        response = await postToPhonePe(p);
        break;
      } catch (err) {
        lastErr = err;
        const msg = err?.response?.data || err?.message || "";
        console.error(`Pay path failed (${p}):`, msg);
        // Only try next if it's an API mapping issue; otherwise bail
        if (!String(msg).includes("Api Mapping Not Found")) {
          break;
        }
      }
    }
    if (!response) throw lastErr;

    console.log("✅ PhonePe Response:", response.data);

    // Include our merchantTransactionId in the response so frontend can persist it
    const respData = { ...response.data, merchantTransactionId };
    res.json(respData);
  } catch (error) {
    console.error(
      "❌ Error creating PhonePe order:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

/**
 * POST /api/payment/phonepe/callback
 * Handle callback from PhonePe
 */
router.post("/phonepe/callback", (req, res) => {
  console.log("📥 PhonePe Callback Received:", req.body);
  res.status(200).json({ msg: "Callback received" });
});

module.exports = router;
