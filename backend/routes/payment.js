const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

// ENV setup (use sandbox)
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || "https://api.phonepe.com/apis/pg-sandbox/pg/v1";
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || 1;

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
      merchantId: MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: userId || "U" + Date.now(),
      amount: amount * 100, // paise
      redirectUrl: `http://localhost:5173/payment-success?orderId=${orderId}`,
      redirectMode: "POST",
      callbackUrl: "http://localhost:9000/api/payment/phonepe-callback",
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
      .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
      .digest("hex");

    const finalXVerify = `${checksum}###${SALT_INDEX}`;
    log("Checksum:", checksum);
    log("X-VERIFY Header:", finalXVerify);

    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": finalXVerify,
      "X-MERCHANT-ID": MERCHANT_ID,
    };

    // Send request to PhonePe sandbox
    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pay`,
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
