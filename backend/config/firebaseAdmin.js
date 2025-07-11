// backend/config/firebaseAdmin.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount;

try {
  const keyPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

  if (!fs.existsSync(keyPath)) {
    throw new Error(`File not found at path: ${keyPath}`);
  }

  const rawData = fs.readFileSync(keyPath, "utf8");
  serviceAccount = JSON.parse(rawData);
} catch (err) {
  console.error("❌ Firebase service account key error:", err.message);
  process.exit(1); // Exit if critical
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
