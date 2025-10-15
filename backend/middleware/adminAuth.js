const verifyAuthFlexible = require('./verifyAuthFlexible');
const User = require('../models/User');

/**
 * Middleware to verify admin access
 * Requires authentication and checks if user has admin role
 */
const adminAuth = async (req, res, next) => {
  // Dev bypass for product/admin/market routes in local/staging if enabled
  // Behavior: In non-production, bypass is ON by default unless DEV_ALLOW_PRODUCT_WRITE=0.
  // In production, bypass is OFF by default unless DEV_ALLOW_PRODUCT_WRITE=1.
  const isDev = process.env.NODE_ENV !== 'production';
  const devAllowFlag = process.env.DEV_ALLOW_PRODUCT_WRITE;
  const bypassDev = isDev ? (devAllowFlag !== '0') : (devAllowFlag === '1');
  if (bypassDev) {
    const base = req.baseUrl || '';
    const p = req.path || '';
    const method = req.method || '';

    // Normalize base checks to support nested baseUrl values like "/api/market/admin/gold"
    const baseProducts = typeof base === 'string' && base.startsWith('/api/products');
    const baseMarket = typeof base === 'string' && base.startsWith('/api/market');

    // Existing: allow non-admin product writes in dev
    const bypassProductWrite =
      baseProducts &&
      ['POST', 'PUT', 'DELETE'].includes(method) &&
      !p.startsWith('/admin/');

    // New: allow admin-only product ops (e.g., /api/products/admin/reprice-today) in dev
    const bypassProductAdmin =
      baseProducts &&
      p.startsWith('/admin/');

    // New: allow admin-only market ops (e.g., /api/market/admin/gold/set-manual, /refresh) in dev
    const bypassMarketAdmin =
      baseMarket &&
      p.startsWith('/admin/');

    if (bypassProductWrite || bypassProductAdmin || bypassMarketAdmin) {
      if (isDev) {
        console.log('[adminAuth] dev bypass:', method, req.originalUrl);
      }
      // Provide a stub admin user so downstream code relying on req.adminUser works
      req.adminUser = { _id: 'dev-bypass', role: 'admin' };
      return next();
    }
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
