const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const User = require("../models/User");

// ✅ For Firebase-authenticated users (Google or OTP via Firebase)
router.post("/sync-user", verifyFirebaseToken, async (req, res) => {
  const { uid, email, phone } = req.user;
  const { name } = req.body;

  console.log("🔐 Syncing user:", { uid, email, phone, name });

  try {
    // Match using any identifier
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
      user = await User.create({
        firebaseUid: uid,
        email: email || null,
        phone: phone || null,
        name: name || null,
      });
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

module.exports = router;
