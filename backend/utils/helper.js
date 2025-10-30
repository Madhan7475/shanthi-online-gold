// Helper: resolve user via flexible auth
const User = require("../models/User");

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
module.exports = resolveUser;
