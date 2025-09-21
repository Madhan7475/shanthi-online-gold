const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
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

    const mappedCart = mapCart(req, cart);
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

    // Validate required fields
    if (!productId || !name || !price || !image || !category) {
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
      const mappedCart = mapCart(req, cart);
      return res.status(409).json({
        success: false,
        message: 'Item already in cart',
        cart: mappedCart
      });
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        name,
        price,
        image,
        quantity,
        category,
        description,
        weight,
        purity,
      });
    }

    await cart.save();

    const mappedCart = mapCart(req, cart);
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
    await cart.save();

    const mappedCart = mapCart(req, cart);
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

    const mappedCart = mapCart(req, cart);
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

    const mappedCart = mapCart(req, cart);
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

    const { customer, paymentMethod = 'phonepe', transactionId } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Customer information is required'
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Create order from cart items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      category: item.category,
      description: item.description,
      weight: item.weight,
      purity: item.purity,
    }));

    const newOrder = new Order({
      userId: userId,
      customerName: customer.name,
      items: orderItems,
      total: cart.totalAmount,
      status: 'Pending',
      deliveryAddress: customer.deliveryAddress,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
    });

    await newOrder.save();

    // Create invoice
    const newInvoice = new Invoice({
      customerName: customer.name,
      amount: cart.totalAmount,
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
