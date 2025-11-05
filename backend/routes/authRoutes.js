const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");
const User = require("../models/User");
const resolveUser = require("../utils/helper");
const { syncOrCreateUser } = require("../services/firebaseAuthService");

// ✅ For Firebase-authenticated users (Google or OTP via Firebase)
router.post("/sync-user", verifyFirebaseToken, async (req, res) => {
  const { uid, email, phone } = req.user;
  const { name } = req.body;

  try {
    // Determine auth method based on available data
    const authMethod = email && !phone ? 'google' : 'phone';
    
    console.log(`🔄 Syncing user - UID: ${uid}, Email: ${email}, Phone: ${phone}, Method: ${authMethod}`);

    // Use the new service to handle user sync and account merging
    const { user, mergedFromUid } = await syncOrCreateUser({
      firebaseUid: uid,
      phone: phone || null,
      email: email || null,
      name: name || null,
      authMethod,
    });

    // Handle deleted users
    if (user && user.isDeleted) {
      console.log(
        `🗑️ Found deleted user record: ${user._id}, cleaning up for fresh registration`
      );

      // Check if there are any old deleted records with prefixed email/phone for this user
      const deletedUserQuery = {
        isDeleted: true,
        $or: [],
      };

      if (email) {
        deletedUserQuery.$or.push({
          email: {
            $regex: `deleted_.*_${email.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}$`,
          },
        });
      }
      if (phone) {
        deletedUserQuery.$or.push({
          phone: {
            $regex: `deleted_.*_${phone.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}$`,
          },
        });
      }

      if (deletedUserQuery.$or.length > 0) {
        // Remove old deleted records to prevent data accumulation
        const deletedRecords = await User.find(deletedUserQuery);
        if (deletedRecords.length > 0) {
          await User.deleteMany(deletedUserQuery);
          console.log(
            `🧹 Cleaned up ${deletedRecords.length} old deleted record(s) for fresh registration`
          );
        }
      }

      // Return error for deleted account
      return res.status(403).json({
        message: "Account has been deleted. Please contact support if you believe this is an error.",
        code: "ACCOUNT_DELETED"
      });
    }

    const response = {
      message: "User synced",
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
      response.mergedFromUid = mergedFromUid;
      response.message = "User synced and accounts merged";
      console.log(`✅ Accounts merged: ${mergedFromUid} -> ${uid}`);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error syncing user:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
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

    // � Handle deleted users - clean up old deleted records and allow fresh registration
    if (user && user.isDeleted) {
      console.log(
        `🗑️ Found deleted user record via OTP: ${user._id}, cleaning up for fresh registration`
      );

      // Check if there are any old deleted records with prefixed phone for this user
      const deletedUserQuery = {
        isDeleted: true,
        phone: {
          $regex: `deleted_.*_${phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        },
      };

      // Remove old deleted records to prevent data accumulation
      const deletedRecords = await User.find(deletedUserQuery);
      if (deletedRecords.length > 0) {
        await User.deleteMany(deletedUserQuery);
        console.log(
          `🧹 Cleaned up ${deletedRecords.length} old deleted record(s) for fresh OTP registration`
        );
      }

      // Set user to null so a fresh account can be created below
      user = null;
    }

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
    const dbUser = await resolveUser(req);
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
    return res
      .status(500)
      .json({ error: "whoami failed", details: e?.message || String(e) });
  }
});

module.exports = router;
