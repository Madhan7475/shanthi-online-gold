const verifyAuthFlexible = require('./verifyAuthFlexible');
const User = require('../models/User');

/**
 * Middleware to verify admin access
 * Requires authentication and checks if user has admin role
 */
const adminAuth = async (req, res, next) => {
  // Dev bypass for product write routes in local/staging if enabled
  if (
    process.env.DEV_ALLOW_PRODUCT_WRITE === '1' &&
    req.baseUrl === '/api/products' &&
    ['POST', 'PUT', 'DELETE'].includes(req.method) &&
    !(req.path || '').startsWith('/admin/')
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[adminAuth] bypassing auth for product write in dev:', req.method, req.originalUrl);
    }
    // Provide a stub admin user so downstream code relying on req.adminUser works
    req.adminUser = { _id: 'dev-bypass', role: 'admin' };
    return next();
  }

  // First verify authentication using the flexible auth
  verifyAuthFlexible(req, res, async () => {
    try {
      let user = null;

      // Get user based on auth type
      if (req.auth.type === 'firebase') {
        // Find user by Firebase UID
        user = await User.findOne({ firebaseUid: req.user.uid });
      } else if (req.auth.type === 'jwt') {
        // User is already fetched in verifyAuthFlexible for JWT
        user = await User.findById(req.user.userId);
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      // Add user info to request
      req.adminUser = user;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  });
};

module.exports = adminAuth;
