// backend/scripts/promoteAdmin.js
// Promote a user to admin by email, phone, or firebaseUid.
// Usage (run from project root or backend folder):
//   ENV_FILE=.env.prod node backend/scripts/promoteAdmin.js --email="user@example.com"
//   ENV_FILE=.env.prod node backend/scripts/promoteAdmin.js --phone="9999999999"
//   ENV_FILE=.env.prod node backend/scripts/promoteAdmin.js --firebaseUid="FIREBASE_UID_HERE"
//
// Windows PowerShell examples:
//   $env:ENV_FILE = ".env.prod"; node backend/scripts/promoteAdmin.js --email="user@example.com"
//   $env:ENV_FILE = ".env.prod"; node backend/scripts/promoteAdmin.js --firebaseUid="abc123..."
//
// Notes:
// - Requires MONGO_URI in the ENV_FILE specified.
// - This sets role='admin' for the matched user.

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const connectDB = require('../config/db');
const User = require('../models/User');

const argv = yargs(hideBin(process.argv))
    .option('email', {
        type: 'string',
        describe: 'User email to promote',
    })
    .option('phone', {
        type: 'string',
        describe: 'User phone to promote',
    })
    .option('firebaseUid', {
        type: 'string',
        describe: 'User Firebase UID to promote',
    })
    .check((args) => {
        if (!args.email && !args.phone && !args.firebaseUid) {
            throw new Error('Provide one of --email, --phone, or --firebaseUid');
        }
        return true;
    })
    .help()
    .strict()
    .argv;

(async () => {
    await connectDB();

    const query = {};
    if (argv.email) query.email = String(argv.email).toLowerCase();
    if (argv.phone) query.phone = String(argv.phone);
    if (argv.firebaseUid) query.firebaseUid = String(argv.firebaseUid);

    const user = await User.findOne(query);
    if (!user) {
        console.error('❌ User not found for query:', query);
        process.exit(1);
    }

    const before = user.role;
    user.role = 'admin';
    await user.save();

    console.log('✅ Promoted user to admin:');
    console.log({
        id: String(user._id),
        email: user.email || null,
        phone: user.phone || null,
        firebaseUid: user.firebaseUid || null,
        roleBefore: before,
        roleAfter: user.role,
    });

    process.exit(0);
})().catch((e) => {
    console.error('❌ Error promoting user:', e?.message || e);
    process.exit(1);
});
