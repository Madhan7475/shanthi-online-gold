const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const verifyAuthFlexible = require('../middleware/verifyAuthFlexible');
const resolveUser = require('../utils/helper');

// Apply authentication middleware to all wishlist routes
router.use(verifyAuthFlexible);

// GET /api/wishlist - Get user's wishlist items
router.get('/', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const wishlistItems = await Wishlist.find({ userId: user._id })
      .populate('productId')
      .sort({ createdAt: -1 });

    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      message: 'Error fetching wishlist items',
      error: error.message
    });
  }
});

// POST /api/wishlist - Add item to wishlist
router.post('/', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({ userId: user._id, productId });
    if (existingItem) {
      return res.status(409).json({ message: 'Item already in wishlist' });
    }

    // Create wishlist item with product data
    const wishlistItem = new Wishlist({
      userId: user._id,
      productId: productId,
      product: {
        title: product.title,
        price: product.price,
        images: product.images,
        category: product.category,
        karatage: product.karatage,
        materialColour: product.materialColour,
        grossWeight: product.grossWeight,
        metal: product.metal,
      }
    });

    await wishlistItem.save();

    const populatedItem = await Wishlist.findById(wishlistItem._id).populate('productId');

    res.status(201).json({
      message: 'Item added to wishlist',
      item: populatedItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Item already in wishlist' });
    }

    res.status(500).json({
      message: 'Error adding item to wishlist',
      error: error.message
    });
  }
});

// DELETE /api/wishlist/:itemId - Remove item from wishlist
router.delete('/:itemId', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const deletedItem = await Wishlist.findOneAndDelete({
      _id: itemId,
      userId: user._id
    });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      message: 'Error removing item from wishlist',
      error: error.message
    });
  }
});

// DELETE /api/wishlist/product/:productId - Remove item by productId
router.delete('/product/:productId', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const deletedItem = await Wishlist.findOneAndDelete({
      productId: productId,
      userId: user._id
    });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      message: 'Error removing item from wishlist',
      error: error.message
    });
  }
});

// POST /api/wishlist/move-to-cart - Move wishlist item to cart (create order)
router.post('/move-to-cart', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const { itemId, quantity = 1, size } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    // Find wishlist item
    const wishlistItem = await Wishlist.findOne({
      _id: itemId,
      userId: user._id
    }).populate('productId');

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    // Create order (cart item)
    const orderData = {
      userId: user._id,
      items: [{
        productId: wishlistItem.productId._id,
        title: wishlistItem.product.title,
        price: wishlistItem.product.price,
        quantity: quantity,
        size: size || null,
        images: wishlistItem.product.images,
        karatage: wishlistItem.product.karatage,
        materialColour: wishlistItem.product.materialColour,
        grossWeight: wishlistItem.product.grossWeight,
        metal: wishlistItem.product.metal,
      }],
      totalAmount: wishlistItem.product.price * quantity,
      status: 'pending',
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      }
    };

    const order = new Order(orderData);
    await order.save();

    // Create initial status history entry
    await OrderStatusHistory.addStatusChange(
      order._id,
      'pending',
      'system',
      'Order created from wishlist',
      user._id.toString(),
      { source: 'wishlist' }
    );

    // Remove from wishlist
    await Wishlist.findByIdAndDelete(itemId);

    res.json({
      message: 'Item moved to cart successfully',
      order: order
    });
  } catch (error) {
    console.error('Error moving item to cart:', error);
    res.status(500).json({
      message: 'Error moving item to cart',
      error: error.message
    });
  }
});

// GET /api/wishlist/count - Get wishlist items count
router.get('/count', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const count = await Wishlist.countDocuments({ userId: user._id });

    res.json({ count });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({
      message: 'Error getting wishlist count',
      error: error.message
    });
  }
});

// POST /api/wishlist/check - Check if product is in wishlist
router.post('/check', async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const item = await Wishlist.findOne({ userId: user._id, productId });

    res.json({ inWishlist: !!item });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      message: 'Error checking wishlist',
      error: error.message
    });
  }
});

module.exports = router;
