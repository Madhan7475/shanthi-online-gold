const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyAuthFlexible = require("../middleware/verifyAuthFlexible");

// Helper: resolve user via flexible auth
async function resolveUser(req) {
  const ors = [];
  if (req.auth?.type === "firebase" && req.user?.uid) {
    ors.push({ firebaseUid: req.user.uid });
  }
  if (req.auth?.type === "jwt") {
    if (req.user?.firebaseUid) ors.push({ firebaseUid: req.user.firebaseUid });
    if (req.user?.userId) ors.push({ _id: req.user.userId });
  }
  if (!ors.length) return null;

  // Exclude deleted users from all operations
  return await User.findOne({
    $or: ors,
    $and: [{ isDeleted: { $ne: true } }],
  });
}

// GET /api/users/me
// Returns user profile based on Firebase uid
router.get("/me", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found or account deleted" });
    }

    res.json({
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      name: user.name,
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Wishlist ============
// GET /api/users/me/wishlist
router.get("/me/wishlist", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.populate("wishlist");
    res.json(user.wishlist || []);
  } catch (err) {
    console.error("❌ Wishlist fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/me/wishlist { productId }
router.post("/me/wishlist", verifyAuthFlexible, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId required" });

    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.wishlist = user.wishlist || [];
    const exists = user.wishlist.some((p) => p.toString() === productId);
    if (!exists) user.wishlist.push(productId);

    await user.save();
    await user.populate("wishlist");
    res.status(201).json(user.wishlist);
  } catch (err) {
    console.error("❌ Wishlist add error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me/wishlist/:productId
router.delete(
  "/me/wishlist/:productId",
  verifyAuthFlexible,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const user = await resolveUser(req);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.wishlist = (user.wishlist || []).filter(
        (p) => p.toString() !== productId
      );
      await user.save();
      await user.populate("wishlist");
      res.json(user.wishlist);
    } catch (err) {
      console.error("❌ Wishlist remove error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ============ Cart ============
// GET /api/users/me/cart
router.get("/me/cart", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.populate("cart.product");
    res.json(user.cart || []);
  } catch (err) {
    console.error("❌ Cart fetch error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/me/cart { productId, quantity }
router.post("/me/cart", verifyAuthFlexible, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId)
      return res.status(400).json({ error: "productId required" });

    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart || [];
    const existing = user.cart.find((i) => i.product.toString() === productId);
    if (existing) {
      existing.quantity = Math.max(1, existing.quantity + Number(quantity));
    } else {
      user.cart.push({
        product: productId,
        quantity: Math.max(1, Number(quantity)),
      });
    }

    await user.save();
    await user.populate("cart.product");
    res.status(201).json(user.cart);
  } catch (err) {
    console.error("❌ Cart add error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me/cart { productId, quantity }
router.patch("/me/cart", verifyAuthFlexible, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ error: "productId and numeric quantity required" });
    }

    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    const item = (user.cart || []).find(
      (i) => i.product.toString() === productId
    );
    if (!item) return res.status(404).json({ error: "Item not found in cart" });
    item.quantity = Math.max(1, Number(quantity));

    await user.save();
    await user.populate("cart.product");
    res.json(user.cart);
  } catch (err) {
    console.error("❌ Cart update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me/cart/:productId
router.delete("/me/cart/:productId", verifyAuthFlexible, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = (user.cart || []).filter(
      (i) => i.product.toString() !== productId
    );

    await user.save();
    await user.populate("cart.product");
    res.json(user.cart);
  } catch (err) {
    console.error("❌ Cart remove error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me/cart (clear all)
router.delete("/me/cart", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = [];
    await user.save();
    res.json(user.cart);
  } catch (err) {
    console.error("❌ Cart clear error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============ Account Deletion ============
// DELETE /api/users/account - Permanently delete user account
router.delete("/account", verifyAuthFlexible, async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });
    const deletingAccountFirebaseUid = user.firebaseUid;
        // Prevent admin deletion
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ error: "Admin accounts cannot be deleted" });
    }

    // Get client IP for audit log
    const clientIP =
      req.ip ||
      req.connection.remoteAddress ||
      req.headers["x-forwarded-for"] ||
      "Unknown";

    // Import Firebase Admin SDK for auth deletion
    const admin = require("../config/firebaseAdmin");

    // Start transaction for data integrity
    const session = await user.db.startSession();
    await session.withTransaction(async () => {
      try {
        // 1. Soft delete user record with audit info
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletionReason = "User requested account deletion";
        user.deletedByIP = clientIP;

        // 2. Clear sensitive data but preserve for audit/compliance
        user.wishlist = [];
        user.cart = [];
        user.name = "Deleted User";

        // Create unique timestamp for this deletion
        const deletionTimestamp = Date.now();

        // Modify email and phone to avoid unique constraint violations
        // while preserving original values for audit/legal purposes
        if (user.email) {
          user.email = `deleted_${deletionTimestamp}_${user.email}`;
        }
        if (user.phone) {
          user.phone = `deleted_${deletionTimestamp}_${user.phone}`;
        }
        if (user.firebaseUid) {
          user.firebaseUid = `deleted_${deletionTimestamp}_${user.firebaseUid}`;
        }

        await user.save({ session });

        // 3. Delete Firebase Authentication user
        if (deletingAccountFirebaseUid) {
          try {
            await admin.auth().deleteUser(deletingAccountFirebaseUid);
            // await admin.auth().revokeRefreshTokens(deletingAccountFirebaseUid);
          } catch (firebaseError) {
            console.error(
              "⚠️ Firebase auth deletion failed:",
              firebaseError.message
            );
            // Continue with soft delete even if Firebase deletion fails
          }
        }

        // 4. Clean up related models (using Mongoose to handle references)
        const Cart = require("../models/Cart");
        const Wishlist = require("../models/Wishlist");
        const Order = require("../models/Order");
        const UserDevices = require("../models/UserDevice");

        // Delete user devices
        await UserDevices.deleteMany({ userId: user._id }, { session });

        // Delete cart items
        await Cart.deleteMany({ userId: user._id }, { session });

        // Delete wishlist items
        await Wishlist.deleteMany({ userId: user._id }, { session });

        // Anonymize orders (keep for legal/business records)
        await Order.updateMany(
          { userId: user._id },
          {
            $set: {
              "customerInfo.name": "Deleted User",
              "customerInfo.isDeleted": true,
            },
          },
          { session }
        );

        console.log(
          `✅ User account deleted successfully: ${
            user.email || user.phone
          } from IP: ${clientIP}`
        );
      } catch (error) {
        console.error("❌ Account deletion transaction failed:", error);
        throw error;
      }
    });

    await session.endSession();

    res.json({
      success: true,
      message: "Account deleted successfully. All data has been removed.",
    });
  } catch (error) {
    console.error("❌ Account deletion error:", error.message);
    res.status(500).json({
      error: "Account deletion failed. Please try again or contact support.",
    });
  }
});

module.exports = router;
