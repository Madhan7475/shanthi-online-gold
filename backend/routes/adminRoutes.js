const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// GET /api/admin/users - Get all users with pagination and search
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // Build search query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && ['customer', 'admin'].includes(role)) {
      query.role = role;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(query)
      .select('name email phone role firebaseUid createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id - Get single user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email phone role firebaseUid createdAt updatedAt');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid role (customer/admin) is required' 
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Prevent operations on deleted users
    if (user.isDeleted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot modify deleted user account' 
      });
    }
    
    // Prevent removing the last admin
    if (user.role === 'admin' && role === 'customer') {
      const adminCount = await User.countDocuments({ 
        role: 'admin',
        isDeleted: { $ne: true }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot remove the last admin user' 
        });
      }
    }
    
    user.role = role;
    await user.save();
    
    res.json({ 
      success: true, 
      data: user,
      message: `User role updated to ${role}` 
    });
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/admin/profile - Update admin's own profile
router.put('/profile', adminAuth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const adminUser = req.adminUser;
    
    // Validate email uniqueness if changing
    if (email && email !== adminUser.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: adminUser._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already exists' 
        });
      }
    }
    
    // Validate phone uniqueness if changing
    if (phone && phone !== adminUser.phone) {
      const existingUser = await User.findOne({ 
        phone,
        _id: { $ne: adminUser._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number already exists' 
        });
      }
    }
    
    // Update fields
    if (name) adminUser.name = name;
    if (email) adminUser.email = email.toLowerCase();
    if (phone) adminUser.phone = phone;
    
    await adminUser.save();
    
    res.json({ 
      success: true, 
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role
      },
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating admin profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/profile - Get admin's own profile
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const adminUser = req.adminUser;
    
    res.json({ 
      success: true, 
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get user statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalAdmins,
        recentUsers
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
