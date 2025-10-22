const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");
const User = require("../models/User");

// ✅ For Firebase-authenticated users (Google or OTP via Firebase)
router.post("/sync-user", verifyFirebaseToken, async (req, res) => {
  const { uid, email, phone } = req.user;
  const { name } = req.body;

  try {
    // 🔍 Find user by any identifier (important for case #3)
    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean),
    });

    if (user) {
      let updated = false;

      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        updated = true;
      }
      if (!user.email && email) {
        user.email = email;
        updated = true;
      }
      if (!user.phone && phone) {
        user.phone = phone;
        updated = true;
      }
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }

      if (updated) {
        await user.save();
        console.log("🔄 Updated user:", user._id);
      } else {
        console.log("📌 Existing user found:", user._id);
      }

    } else {
      // 🛡️ Prevent inserting null phone/email
      if (!email && !phone) {
        return res.status(400).json({ message: "Phone or Email required." });
      }

      const newUserData = {
        firebaseUid: uid,
        name: name || null,
      };
      if (email) newUserData.email = email;
      if (phone) newUserData.phone = phone;

      user = await User.create(newUserData);
      console.log("✅ Created new user:", user._id);
    }

    res.status(200).json({ message: "User synced", user });
  } catch (error) {
    console.error("❌ Error syncing user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});



// ✅ For 2Factor-authenticated users (manual OTP login)
router.post("/otp-login", async (req, res) => {
  const { phone, name } = req.body;

  if (!phone || !name) {
    return res.status(400).json({ message: "Phone and name are required" });
  }

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ phone, name });
      console.log("✅ Created user via 2Factor OTP:", user._id);
    } else if (!user.name) {
      user.name = name;
      await user.save();
      console.log("🔄 Updated user name:", user._id);
    }

    res.status(200).json({ user, message: "OTP login successful" });
  } catch (err) {
    console.error("❌ OTP login error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/auth/whoami
 * Returns the authenticated principal (from token) and the matched DB user (including role).
 * Helps diagnose 401/403 issues.
 */
router.get("/whoami", verifyAuthFlexible, async (req, res) => {
  try {
    let dbUser = null;
    if (req.auth?.type === "firebase") {
      dbUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
    } else if (req.auth?.type === "jwt") {
      dbUser = await User.findById(req.user.userId).lean();
    }
    return res.json({
      auth: req.auth || null,
      userFromToken: req.user || null,
      dbUser: dbUser
        ? {
          id: String(dbUser._id),
          email: dbUser.email || null,
          phone: dbUser.phone || null,
          firebaseUid: dbUser.firebaseUid || null,
          role: dbUser.role || null,
        }
        : null,
    });
  } catch (e) {
    return res.status(500).json({ error: "whoami failed", details: e?.message || String(e) });
  }
});

module.exports = router;
