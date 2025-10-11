const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
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
  return await User.findOne({ $or: ors });
}

// GET /api/users/me
// Returns user profile based on Firebase uid
router.get("/me", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      name: user.name
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
    if (!productId) return res.status(400).json({ error: "productId required" });

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
router.delete("/me/wishlist/:productId", verifyAuthFlexible, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.wishlist = (user.wishlist || []).filter((p) => p.toString() !== productId);
    await user.save();
    await user.populate("wishlist");
    res.json(user.wishlist);
  } catch (err) {
    console.error("❌ Wishlist remove error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    if (!productId) return res.status(400).json({ error: "productId required" });

    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart || [];
    const existing = user.cart.find((i) => i.product.toString() === productId);
    if (existing) {
      existing.quantity = Math.max(1, existing.quantity + Number(quantity));
    } else {
      user.cart.push({ product: productId, quantity: Math.max(1, Number(quantity)) });
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
      return res.status(400).json({ error: "productId and numeric quantity required" });
    }

    const user = await resolveUser(req);
    if (!user) return res.status(404).json({ error: "User not found" });

    const item = (user.cart || []).find((i) => i.product.toString() === productId);
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

    user.cart = (user.cart || []).filter((i) => i.product.toString() !== productId);

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

module.exports = router;
