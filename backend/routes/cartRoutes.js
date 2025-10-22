const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const { getLatestGoldPrice } = require('../services/goldPriceService');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');

// Helper function to get user ID
const getUserId = (req) => {
  if (req.auth?.type === 'firebase') {
    return req.user.uid;
  } else if (req.auth?.type === 'jwt') {
    return req.user.firebaseUid || req.user.userId;
  }
  return null;
};

// Build absolute URL for image filename or relative path
const fileToUrl = (req, value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  const rel = String(value).startsWith('/uploads') ? value : `/uploads/${value}`;
  return `${req.protocol}://${req.get('host')}${rel}`;
};

const mapItem = (req, item) => {
  const obj = item.toObject ? item.toObject() : item;
  return {
    ...obj,
    imageUrl: fileToUrl(req, obj.image),
  };
};

const mapCart = (req, cart) => {
  const c = cart.toObject ? cart.toObject() : cart;
  return {
    items: (c.items || []).map((it) => mapItem(req, it)),
    totalAmount: c.totalAmount || 0,
    totalItems: c.totalItems || 0,
  };
};

// Live price helpers (making charges waived)
const parseGrams = (s) => {
  if (s == null) return null;
  const n = parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const parseKarat = (karatage) => {
  if (!karatage) return null;
  const s = String(karatage).toUpperCase().trim();
  const m = s.match(/([0-9]{2})\s*K|([0-9]{2})\s*KT|^([0-9]{2})$/i);
  if (m) {
    const k = parseInt(m[1] || m[2] || m[3], 10);
    if (k > 0 && k <= 24) return k;
  }
  if (s.includes("24")) return 24;
  if (s.includes("22")) return 22;
  if (s.includes("18")) return 18;
  return null;
};
const rateForKarat = (karat, pricePerGram24kInr, pricePerGram22kInr) => {
  if (!pricePerGram24kInr) return null;
  if (karat === 24) return pricePerGram24kInr;
  if (karat === 22 && pricePerGram22kInr) return pricePerGram22kInr;
  if (typeof karat === "number" && karat > 0 && karat <= 24) {
    return pricePerGram24kInr * (karat / 24);
  }
  return pricePerGram22kInr || pricePerGram24kInr;
};
const computeLivePriceFrom = (weight, purity, rates) => {
  const grams = parseGrams(weight);
  const karat = parseKarat(purity) ?? 22;
  const perGram = rateForKarat(karat, rates?.pricePerGram24kInr, rates?.pricePerGram22kInr);
  if (grams != null && perGram != null && isFinite(grams) && isFinite(perGram)) {
    // Apply the same rule used on listings/detail: +6% on total (making charges waived)
    return Math.round(grams * perGram * 1.06);
  }
  return null;
};

// Compute live price for a cart item, with robust fallbacks for legacy items
const computeLivePriceForItem = async (item, rates) => {
  // 1) Try from item snapshot (weight/purity were saved on add for new carts)
  let price = computeLivePriceFrom(item.weight, item.purity, rates);
  if (price != null) return price;

  // 2) Fallback to product document (legacy carts may not have weight/purity saved)
  try {
    if (item.productId) {
      const prod = await Product.findById(item.productId).lean();
      if (prod) {
        const weight = prod.grossWeight ?? item.weight;
        const purity = prod.karatage ?? item.purity;
        price = computeLivePriceFrom(weight, purity, rates);
        if (price != null) return price;

        // 3) As a last resort, use current DB price (may already reflect latest repricing)
        if (Number.isFinite(Number(prod.price))) return Number(prod.price);
      }
    }
  } catch { /* ignore */ }

  // 4) Final fallback to item price saved in cart (may be stale)
  return Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
};
const mapCartWithLive = async (req, cart, rates) => {
  const c = cart.toObject ? cart.toObject() : cart;
  const items = await Promise.all((c.items || []).map(async (it) => {
    const base = mapItem(req, it);
    const price = await computeLivePriceForItem(base, rates);
    return {
      ...base,
      originalPrice: base.price,
      price,
    };
  }));
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
  const totalItems = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  return { items, totalAmount, totalItems };
};

// @route   GET /api/cart
// @desc    Get user's cart items
// @access  Private
router.get('/', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    let rates = null;
    try { rates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const mappedCart = await mapCartWithLive(req, cart, rates);
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      cart: mappedCart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart',
      error: error.message
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const { productId, name, price, image, quantity = 1, category, description, weight, purity } = req.body;

    // Validate required fields (server computes price; price not required from client)
    if (!productId || !name || !image || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required product information'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Do not increment quantity; return conflict indicating already in cart
      // Respond with live prices so UI reflects the latest gold rate even for existing items
      let confRates = null;
      try { confRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
      const mappedCart = await mapCartWithLive(req, cart, confRates);
      res.set('Cache-Control', 'no-store');
      return res.status(409).json({
        success: false,
        message: 'Item already in cart',
        cart: mappedCart
      });
    } else {
      // Add new item to cart (compute server-side price using live rates; making charges waived)
      let liveRates = null;
      try { liveRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
      const weightSrc = (typeof weight !== 'undefined' && weight !== null) ? weight : product.grossWeight;
      const puritySrc = (typeof purity !== 'undefined' && purity !== null) ? purity : product.karatage;
      const livePrice = computeLivePriceFrom(weightSrc, puritySrc, liveRates);
      const serverPrice = Number.isFinite(Number(price)) ? Number(price) : (Number.isFinite(Number(product.price)) ? Number(product.price) : 0);
      const finalPrice = (livePrice != null ? livePrice : serverPrice);

      cart.items.push({
        productId,
        name,
        price: finalPrice,
        image,
        quantity,
        category,
        description,
        weight: weightSrc,
        purity: puritySrc,
      });
    }

    await cart.save();

    let addRates = null;
    try { addRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const mappedCart = await mapCartWithLive(req, cart, addRates);
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: mappedCart
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding item to cart',
      error: error.message
    });
  }
});

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:itemId', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;

    // Recompute item price using live rate (making charges waived)
    let updRates = null;
    try { updRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const updItem = cart.items[itemIndex];
    const newPrice = computeLivePriceFrom(updItem.weight, updItem.purity, updRates);
    if (newPrice != null) {
      cart.items[itemIndex].price = newPrice;
    }
    await cart.save();

    const mappedCart = await mapCartWithLive(req, cart, updRates);
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Cart item updated successfully',
      cart: mappedCart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating cart item',
      error: error.message
    });
  }
});

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    let delRates = null;
    try { delRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const mappedCart = await mapCartWithLive(req, cart, delRates);
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: mappedCart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing cart item',
      error: error.message
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    let clrRates = null;
    try { clrRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const mappedCart = await mapCartWithLive(req, cart, clrRates);
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: mappedCart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart',
      error: error.message
    });
  }
});

// @route   POST /api/cart/checkout
// @desc    Process checkout (create order and clear cart)
// @access  Private
router.post('/checkout', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const { customer, paymentMethod = 'phonepe' } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Create order from cart items using live prices
    let coRates = null;
    try { coRates = await getLatestGoldPrice({ allowFetch: true }); } catch { }
    const orderItems = await Promise.all(cart.items.map(async (item) => {
      const price = await computeLivePriceForItem(item, coRates);
      return {
        productId: item.productId,
        name: item.name,
        price,
        image: item.image,
        quantity: item.quantity,
        category: item.category,
        description: item.description,
        weight: item.weight,
        purity: item.purity,
      };
    }));
    const orderTotal = orderItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

    const newOrder = new Order({
      userId: userId,
      customerName: customer.name,
      items: orderItems,
      total: orderTotal,
      status: 'pending',
      deliveryAddress: customer.deliveryAddress,
      paymentMethod: paymentMethod,
      transactionId: 'TEMP_' + Date.now(), // Placeholder, to be updated after payment confirmation
    });

    await newOrder.save();

    // Create invoice
    const newInvoice = new Invoice({
      customerName: customer.name,
      amount: orderTotal,
      status: 'Pending',
      orderId: newOrder._id,
    });

    await newInvoice.save();

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder,
      invoice: newInvoice
    });

  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during checkout',
      error: error.message
    });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart items count
// @access  Private
router.get('/count', verifyAuthFlexible, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: 'Unable to identify user' });
    }

    const cart = await Cart.findOne({ userId });
    const count = cart ? cart.totalItems : 0;

    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart count',
      error: error.message
    });
  }
});

module.exports = router;
