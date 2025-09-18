const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

// === Read credentials from .env ===
const PHONEPE_ENV = process.env.PHONEPE_ENV || "sandbox"; // "sandbox" or "production"
const PHONEPE_BASE_URL =
  process.env.PHONEPE_BASE_URL ||
  (PHONEPE_ENV === "sandbox"
    ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
    : "https://api.phonepe.com/apis/pg");

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "MERCHANT123";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "SALT1234567890";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

console.log(`🟢 PhonePe ${PHONEPE_ENV.toUpperCase()} Mode Enabled`);
console.log("Merchant ID:", PHONEPE_MERCHANT_ID);

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
  const { amount = 100, orderData = {} } = req.body; // amount in INR
  const merchantTransactionId = "txn_" + Date.now();

  try {
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: req.user.uid,
      amount: amount * 100, // paise
      redirectUrl: `${process.env.FRONTEND_URL}/payment-success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.BACKEND_URL}/api/payment/phonepe/callback`,
      mobileNumber: orderData.customer?.phone || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    console.log("📦 Payload before base64:", payload);

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    const checksum = crypto
      .createHash("sha256")
      .update(payloadBase64 + "/pg/v1/pay" + PHONEPE_SALT_KEY)
      .digest("hex");

    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": checksum + "###" + PHONEPE_SALT_INDEX,
      "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
    };

    console.log("🔐 Headers:", headers);

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: payloadBase64 },
      { headers }
    );

    console.log("✅ PhonePe Response:", response.data);

    res.json(response.data);
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
