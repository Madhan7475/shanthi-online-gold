// backend/middleware/verifyAuthFlexible.js
const admin = require("../config/firebaseAdmin");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Accepts either:
 * - Firebase ID token (Google/phone via Firebase)
 * - Local JWT issued by our OTP flow (payload: { id: MongoUserId, phone })
 *
 * Sets:
 *  - req.auth = { type: 'firebase' | 'jwt' }
 *  - req.user:
 *      if firebase: { uid, email, phone }
 *      if jwt: { userId, firebaseUid, email, phone }
 */
async function verifyAuthFlexible(req, res, next) {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    // Allow token via query for file downloads opened in a new tab: ?auth=TOKEN or ?token=TOKEN
    if (!token) {
        token = (req.query && (req.query.auth || req.query.token)) || null;
    }
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // 1) Try Firebase ID token
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.auth = { type: "firebase" };
        req.user = {
            uid: decoded.uid,
            email: decoded.email || null,
            phone: decoded.phone_number || null,
        };
        return next();
    } catch (_) {
        // fall through to JWT
    }

    // 2) Try local JWT (OTP flow)
    try {
        const decodedJwt = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedJwt.id);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }
        req.auth = { type: "jwt" };
        req.user = {
            userId: user._id.toString(),
            firebaseUid: user.firebaseUid || null,
            email: user.email || null,
            phone: user.phone || null,
        };
        return next();
    } catch (err) {
        console.error("Auth verification failed:", err.message);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

module.exports = verifyAuthFlexible;
