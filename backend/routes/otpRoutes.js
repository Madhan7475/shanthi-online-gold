const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const API_KEY = "ce6557bd-598a-11f0-a562-0200cd936042"; // your 2Factor API key

// In-memory OTP store keyed by provider sessionId
// Structure: { phone, createdAt, attempts, verified }
const otpStore = new Map();

const normalizePhone = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91")) return digits;
  return digits; // fallback to whatever digits we have
};

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return res.status(400).json({ message: "Valid phone is required" });

  try {
    const { data } = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${encodeURIComponent(normalizedPhone)}/AUTOGEN`
    );
    if (data.Status !== "Success") throw new Error(data.Details);

    // save server-side session for this OTP
    const sessionId = data.Details;
    const now = Date.now();
    // Remove any previous sessions for this phone
    for (const [sid, info] of otpStore.entries()) {
      if (info.phone === normalizedPhone) otpStore.delete(sid);
    }
    otpStore.set(sessionId, { phone: normalizedPhone, createdAt: now, attempts: 0, verified: false });

    res.status(200).json({ sessionId });
  } catch (err) {
    console.error("❌ Send OTP failed:", err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp, sessionId, name, email } = req.body;

  const normPhone = normalizePhone(phone);
  if (!normPhone) {
    return res.status(400).json({ message: "Valid phone is required" });
  }

  try {
    let sessId = sessionId;
    let sess = sessId ? otpStore.get(sessId) : undefined;

    if (!sess) {
      // Fallback: find the most recent session for this phone if sessionId wasn't provided or is invalid
      let latestId = null;
      let latest = null;
      for (const [sid, info] of otpStore.entries()) {
        if (info.phone === normPhone && (!latest || info.createdAt > latest.createdAt)) {
          latestId = sid;
          latest = info;
        }
      }
      if (latestId) {
        sessId = latestId;
        sess = latest;
      }
    }
    const TTL_MS = 5 * 60 * 1000; // 5 minutes

    if (!sess) {
      return res.status(400).json({ message: "Invalid or expired OTP session" });
    }
    if (sess.phone !== normPhone) {
      return res.status(400).json({ message: "Phone does not match OTP session" });
    }
    if (Date.now() - sess.createdAt > TTL_MS) {
      otpStore.delete(sessId);
      return res.status(410).json({ message: "OTP session expired" });
    }

    // If not yet verified with provider, require OTP and verify it now
    if (!sess.verified) {
      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }
      sess.attempts = (sess.attempts || 0) + 1;
      if (sess.attempts > 5) {
        otpStore.delete(sessId);
        return res.status(429).json({ message: "Too many attempts. Please resend OTP." });
      }

      const { data } = await axios.get(
        `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessId}/${otp}`
      );

      if (data.Status !== "Success") {
        return res.status(401).json({ message: "Invalid OTP" });
      }

      // Mark as verified; allow completing registration in a subsequent request if needed
      sess.verified = true;
      otpStore.set(sessId, sess);
    }

    // At this point OTP is verified for this session.
    // Try finding user by phone or email (if provided)
    const digits = String(phone || "").replace(/\D/g, "");
    const last10 = digits.slice(-10);
    const phoneCandidates = Array.from(new Set([
      normPhone,
      last10 ? `+91${last10}` : null,
      last10 ? `91${last10}` : null,
      phone || null,
    ].filter(Boolean)));

    let user = await User.findOne({
      $or: [
        { phone: { $in: phoneCandidates } },
        email ? { email } : null
      ].filter(Boolean),
    });

    if (!user && !email) {
      // OTP is valid, but we need email to merge or create
      return res.status(202).json({ message: "OTP verified, email required", needEmail: true });
    }

    if (!user && email) {
      // New user - create
      user = await User.create({ phone: normPhone, email, name: name || null });
    } else if (user) {
      // Merge: update missing fields
      let updated = false;
      if (!user.phone && normPhone) {
        user.phone = normPhone;
        updated = true;
      }
      if (!user.email && email) {
        user.email = email;
        updated = true;
      }
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      if (updated) await user.save();
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Clean up OTP session(s) for this phone
    otpStore.delete(sessId);
    for (const [sid, info] of otpStore.entries()) {
      if (info.phone === normPhone) otpStore.delete(sid);
    }

    return res.status(200).json({ message: "OTP verified", token, user });
  } catch (err) {
    console.error("❌ Verify OTP failed:", err.message);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});



module.exports = router;
