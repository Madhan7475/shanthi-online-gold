const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const {
  getOrCreateFirebaseUserByPhone,
  generateCustomToken,
  syncOrCreateUser,
} = require("../services/firebaseAuthService");

const router = express.Router();
const API_KEY = "f10d5506-bdf4-11f0-bdde-0200cd936042" // "ce6557bd-598a-11f0-a562-0200cd936042"; // your 2Factor API key

// Demo account configuration for app review
// Phone: 9979994465 (with country code: 919979994465)
// Static OTP: 123456 (for Google Play Store and App Store review)
const DEMO_PHONE = "919979994465";
const DEMO_OTP = "123456";
const DEMO_SESSION_PREFIX = "DEMO_";

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

  // Check if this is the demo account
  if (normalizedPhone === DEMO_PHONE) {
    try {
      const now = Date.now();
      const demoSessionId = `${DEMO_SESSION_PREFIX}${now}`;
      
      // Remove any previous sessions for this phone
      for (const [sid, info] of otpStore.entries()) {
        if (info.phone === normalizedPhone) otpStore.delete(sid);
      }
      
      // Create demo session
      otpStore.set(demoSessionId, { 
        phone: normalizedPhone, 
        createdAt: now, 
        attempts: 0, 
        verified: false,
        isDemo: true 
      });
      
      console.log(`📱 Demo OTP sent for ${normalizedPhone} - Use OTP: ${DEMO_OTP}`);
      return res.status(200).json({ sessionId: demoSessionId });
    } catch (err) {
      console.error("❌ Demo OTP failed:", err.message);
      return res.status(500).json({ message: "Failed to send demo OTP" });
    }
  }

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

      // Handle demo account verification
      if (sess.isDemo && sess.phone === DEMO_PHONE) {
        if (otp !== DEMO_OTP) {
          return res.status(401).json({ message: "Invalid OTP" });
        }
        console.log(`✅ Demo OTP verified for ${DEMO_PHONE}`);
      } else {
        // Regular OTP verification via 2Factor API
        const { data } = await axios.get(
          `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessId}/${otp}`
        );

        if (data.Status !== "Success") {
          return res.status(401).json({ message: "Invalid OTP" });
        }
      }

      // Mark as verified; allow completing registration in a subsequent request if needed
      sess.verified = true;
      otpStore.set(sessId, sess);
    }

    // ✅ OTP is verified - Check if user exists in DB first
    const digits = String(normPhone || "").replace(/\D/g, "");
    const last10 = digits.slice(-10);
    const phoneCandidates = Array.from(new Set([
      normPhone,
      last10 ? `+91${last10}` : null,
      last10 ? `91${last10}` : null,
    ].filter(Boolean)));

    let existingUser = await User.findOne({
      $or: [
        { phone: { $in: phoneCandidates } },
        email ? { email: email.toLowerCase() } : null,
      ].filter(Boolean),
      isDeleted: { $ne: true },
    });

    // 📧 For new users, require email before proceeding
    if (!existingUser && !email) {
      console.log(`📧 New user detected for phone ${normPhone}, email required`);
      // Keep the session verified so they can complete registration
      return res.status(202).json({ 
        message: "OTP verified, email required to complete registration",
        needEmail: true,
        sessionId: sessId,
      });
    }

    // Now create/get Firebase user with phone number
    // Pass email to check for existing Firebase user and avoid duplicates
    console.log(`🔥 Creating/getting Firebase user for phone: ${normPhone}`);
    const phoneForFirebase = normPhone.startsWith('+') ? normPhone : `+${normPhone}`;
    let { uid: firebaseUid, foundByEmail } = await getOrCreateFirebaseUserByPhone(phoneForFirebase, email);
    
    if (foundByEmail) {
      console.log(`✅ Found existing Firebase user by email, no need to create phone-only account`);
    }

    // Sync or create DB user with Firebase UID
    const { user, mergedFromUid, shouldUseExistingFirebaseUid } = await syncOrCreateUser({
      firebaseUid,
      phone: normPhone,
      email: email || null,
      name: name || null,
      authMethod: 'phone',
    });

    // If we merged into an existing account, use that Firebase UID for token generation
    if (shouldUseExistingFirebaseUid) {
      firebaseUid = user.firebaseUid;
      console.log(`🔄 Using existing Firebase UID for token: ${firebaseUid}`);
    }

    // 🚫 Prevent deleted users from OTP verification
    if (user && user.isDeleted) {
      return res.status(403).json({ 
        message: "Account has been deleted. Please contact support if you believe this is an error.",
        code: "ACCOUNT_DELETED"
      });
    }

    // ✅ Generate Firebase custom token instead of JWT
    const customToken = await generateCustomToken(firebaseUid, {
      userId: user._id.toString(),
      phone: user.phone,
    });

    // Clean up OTP session(s) for this phone
    otpStore.delete(sessId);
    for (const [sid, info] of otpStore.entries()) {
      if (info.phone === normPhone) otpStore.delete(sid);
    }

    const response = {
      message: "OTP verified",
      token: customToken,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    if (mergedFromUid) {
      response.accountMerged = true;
      response.message = "OTP verified and accounts merged";
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Verify OTP failed:", err.message);
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
});



module.exports = router;
