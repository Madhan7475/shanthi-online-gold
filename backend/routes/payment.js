const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

/* ENV setup */
function getPhonepeBaseUrl() {
  const env = (process.env.PHONEPE_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_KEY_INDEX = process.env.PHONEPE_KEY_INDEX || 1;

// Debug logger
const log = (...args) => console.log("[PhonePe DEBUG]", ...args);

// ✅ Create order route
router.post("/create-order", async (req, res) => {
  try {
    const { amount, orderId, userId } = req.body;

    log("Incoming request:", req.body);

    if (!amount || !orderId) {
      return res.status(400).json({ error: "Missing amount or orderId" });
    }

    // Construct payload
    const payload = {
      merchantId: PHONEPE_CLIENT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId || "U" + Date.now(),
      amount: amount * 100, // paise
      redirectUrl: `${FRONTEND_URL}/payment-success?orderId=${orderId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${BACKEND_URL}/api/payment/phonepe/callback`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    log("Payload (JSON):", payload);

    // Encode payload in base64
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    log("Payload (Base64):", payloadBase64);

    // Generate checksum
    const checksum = crypto
      .createHash("sha256")
      .update(payloadBase64 + "/pg/v1/pay" + PHONEPE_CLIENT_SECRET)
      .digest("hex");

    const finalXVerify = `${checksum}###${PHONEPE_KEY_INDEX}`;
    log("Checksum:", checksum);
    log("X-VERIFY Header:", finalXVerify);

    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": finalXVerify,
      "X-MERCHANT-ID": PHONEPE_CLIENT_ID,
    };

    // Send request to PhonePe sandbox
    const response = await axios.post(
      `${getPhonepeBaseUrl()}/pg/v1/pay`,
      { request: payloadBase64 },
      { headers }
    );

    log("PhonePe response:", response.data);

    res.json(response.data);
  } catch (err) {
    log("Error creating PhonePe order:", err.response?.data || err.message);
    res.status(500).json({
      error: "PhonePe order creation failed",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
