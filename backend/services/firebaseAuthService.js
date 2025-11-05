const admin = require("../config/firebaseAdmin");
const User = require("../models/User");

/**
 * Firebase Authentication Service
 * Handles Firebase user creation, custom tokens, and account merging
 */

/**
 * Creates or gets a Firebase user by phone number
 * Checks for existing user by email first to avoid creating duplicates
 * @param {string} phone - Phone number in E.164 format (e.g., +919876543210)
 * @param {string} email - Optional email to check for existing user
 * @returns {Promise<{uid: string, isNewUser: boolean, foundByEmail: boolean}>}
 */
async function getOrCreateFirebaseUserByPhone(phone, email = null) {
  try {
    // Normalize phone to E.164 format if not already
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // STEP 1: If email is provided, check if a Firebase user with that email already exists
    // This prevents creating a duplicate phone-only account when user already has Google account
    if (email) {
      try {
        const existingUserByEmail = await admin.auth().getUserByEmail(email);
        console.log(`📧 Found existing Firebase user by email: ${email}, UID: ${existingUserByEmail.uid}`);
        
        // If this user doesn't have a phone number, add it
        if (!existingUserByEmail.phoneNumber) {
          await admin.auth().updateUser(existingUserByEmail.uid, {
            phoneNumber: normalizedPhone,
          });
          console.log(`📱 Added phone ${normalizedPhone} to existing Firebase account ${existingUserByEmail.uid}`);
        }
        
        return { uid: existingUserByEmail.uid, isNewUser: false, foundByEmail: true };
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
        // User with email not found, continue to check by phone
      }
    }
    
    // STEP 2: Try to find existing Firebase user by phone
    try {
      const userRecord = await admin.auth().getUserByPhoneNumber(normalizedPhone);
      console.log(`📱 Found existing Firebase user for phone: ${normalizedPhone}`);
      return { uid: userRecord.uid, isNewUser: false, foundByEmail: false };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // STEP 3: User doesn't exist, create new one
        const newUserRecord = await admin.auth().createUser({
          phoneNumber: normalizedPhone,
          email: email || undefined, // Add email if provided
        });
        console.log(`✅ Created new Firebase user for phone: ${normalizedPhone}, UID: ${newUserRecord.uid}`);
        return { uid: newUserRecord.uid, isNewUser: true, foundByEmail: false };
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error in getOrCreateFirebaseUserByPhone:', error.message);
    throw error;
  }
}

/**
 * Generates a Firebase custom token for a user
 * @param {string} uid - Firebase UID
 * @param {object} additionalClaims - Optional additional claims to add to the token
 * @returns {Promise<string>} Custom token
 */
async function generateCustomToken(uid, additionalClaims = {}) {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    console.log(`🔑 Generated custom token for UID: ${uid}`);
    return customToken;
  } catch (error) {
    console.error('❌ Error generating custom token:', error.message);
    throw error;
  }
}

/**
 * Merges two Firebase accounts when a user signs in with Google after using phone auth
 * Uses a data preservation approach before deletion
 * @param {string} googleUid - Firebase UID from Google sign-in
 * @param {string} phoneUid - Firebase UID from phone auth
 * @param {string} phone - Phone number to preserve
 * @returns {Promise<string>} The merged UID (googleUid)
 */
async function mergeFirebaseAccounts(googleUid, phoneUid, phone) {
  try {
    console.log(`🔄 Merging Firebase accounts: Google UID ${googleUid} <- Phone UID ${phoneUid}`);
    
    // Get both user records
    const [googleUser, phoneUser] = await Promise.all([
      admin.auth().getUser(googleUid),
      admin.auth().getUser(phoneUid),
    ]);

    // Normalize phone only if it's provided
    let normalizedPhone = null;
    if (phone) {
      normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    } else if (phoneUser.phoneNumber) {
      // Use phone from the phone user if not provided
      normalizedPhone = phoneUser.phoneNumber;
    }

    // Preserve any custom claims from the phone account
    const phoneCustomClaims = phoneUser.customClaims || {};
    const googleCustomClaims = googleUser.customClaims || {};
    const mergedClaims = { ...phoneCustomClaims, ...googleCustomClaims };

    // Build update object for Google account
    const updateData = {};
    
    // Add phone number if not already present
    if (normalizedPhone && !googleUser.phoneNumber) {
      updateData.phoneNumber = normalizedPhone;
    }
    
    // Add display name from phone account if Google account doesn't have one
    if (phoneUser.displayName && !googleUser.displayName) {
      updateData.displayName = phoneUser.displayName;
    }
    
    // Add photo URL from phone account if Google account doesn't have one
    if (phoneUser.photoURL && !googleUser.photoURL) {
      updateData.photoURL = phoneUser.photoURL;
    }

    // Delete the phone-only Firebase account FIRST to release the phone number
    await admin.auth().deleteUser(phoneUid);
    console.log(`🗑️ Deleted old phone-only Firebase account ${phoneUid}`);

    // Update Google account with merged data
    if (Object.keys(updateData).length > 0) {
      await admin.auth().updateUser(googleUid, updateData);
      console.log(`✅ Updated Google account ${googleUid} with data from phone account`);
    }
    
    // Update custom claims if there are any to merge
    if (Object.keys(mergedClaims).length > 0) {
      await admin.auth().setCustomUserClaims(googleUid, mergedClaims);
      console.log(`✅ Merged custom claims to Google account ${googleUid}`);
    }

    if (normalizedPhone) {
      console.log(`📱 Added phone ${normalizedPhone} to Google account ${googleUid}`);
    }

    return googleUid;
  } catch (error) {
    console.error('❌ Error merging Firebase accounts:', error.message);
    throw error;
  }
}

/**
 * Finds an existing DB user by phone or email
 * @param {string} phone - Phone number
 * @param {string} email - Email address
 * @returns {Promise<User|null>}
 */
async function findExistingUser(phone, email) {
  const query = {
    $or: [],
    isDeleted: { $ne: true }, // Exclude deleted users
  };

  if (phone) {
    // Try multiple phone formats
    const digits = String(phone).replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const phoneCandidates = Array.from(new Set([
      phone,
      `+91${last10}`,
      `91${last10}`,
      last10,
    ].filter(Boolean)));
    
    query.$or.push({ phone: { $in: phoneCandidates } });
  }

  if (email) {
    query.$or.push({ email: email.toLowerCase() });
  }

  if (query.$or.length === 0) {
    return null;
  }

  try {
    const user = await User.findOne(query);
    return user;
  } catch (error) {
    console.error('❌ Error finding existing user:', error.message);
    return null;
  }
}

/**
 * Syncs or creates DB user and handles Firebase account merging
 * @param {object} params
 * @param {string} params.firebaseUid - Current Firebase UID
 * @param {string} params.phone - Phone number
 * @param {string} params.email - Email address
 * @param {string} params.name - User name
 * @param {string} params.authMethod - 'phone' or 'google'
 * @returns {Promise<{user: User, mergedFromUid: string|null, shouldUseExistingFirebaseUid: boolean}>}
 */
async function syncOrCreateUser({ firebaseUid, phone, email, name, authMethod }) {
  try {
    let mergedFromUid = null;
    let shouldUseExistingFirebaseUid = false;

    // Find existing user by phone or email
    const existingUser = await findExistingUser(phone, email);

    if (existingUser) {
      // Check if this user has a different Firebase UID (account merging scenario)
      if (existingUser.firebaseUid && existingUser.firebaseUid !== firebaseUid) {
        console.log(`🔄 Account merge detected: existing UID ${existingUser.firebaseUid}, new UID ${firebaseUid}`);
        
        // Determine which UID to keep based on auth method
        if (authMethod === 'google') {
          // Google sign-in after phone: merge phone account into Google account
          // The Google UID becomes the primary one
          try {
            await mergeFirebaseAccounts(firebaseUid, existingUser.firebaseUid, phone);
            mergedFromUid = existingUser.firebaseUid;
            existingUser.firebaseUid = firebaseUid;
            console.log(`✅ Merged phone account ${mergedFromUid} into Google account ${firebaseUid}`);
          } catch (mergeError) {
            console.error('⚠️ Firebase account merge failed, updating DB only:', mergeError.message);
            // Still update the DB even if Firebase merge fails
            existingUser.firebaseUid = firebaseUid;
          }
        } else if (authMethod === 'phone') {
          // Phone sign-in after Google: Keep the existing Google UID
          // Delete the newly created phone-only Firebase account
          console.log(`📱 Phone login for existing Google account, keeping Google UID ${existingUser.firebaseUid}`);
          
          try {
            // Delete the newly created phone-only Firebase account
            await admin.auth().deleteUser(firebaseUid);
            console.log(`🗑️ Deleted newly created phone-only Firebase account ${firebaseUid}`);
            
            // Add phone to existing Google Firebase account if phone is provided
            if (phone) {
              const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
              const existingFirebaseUser = await admin.auth().getUser(existingUser.firebaseUid);
              
              if (!existingFirebaseUser.phoneNumber) {
                await admin.auth().updateUser(existingUser.firebaseUid, {
                  phoneNumber: normalizedPhone,
                });
                console.log(`📱 Added phone ${normalizedPhone} to existing Google account ${existingUser.firebaseUid}`);
              }
            }
            
            shouldUseExistingFirebaseUid = true;
            mergedFromUid = firebaseUid; // The phone UID that was deleted
          } catch (mergeError) {
            console.error('⚠️ Firebase phone merge failed:', mergeError.message);
          }
        }
      } else if (!existingUser.firebaseUid) {
        // No Firebase UID yet, set it
        existingUser.firebaseUid = firebaseUid;
      }

      // Update missing fields
      let updated = false;
      if (!existingUser.phone && phone) {
        existingUser.phone = phone;
        updated = true;
      }
      if (!existingUser.email && email) {
        existingUser.email = email;
        updated = true;
      }
      if (!existingUser.name && name) {
        existingUser.name = name;
        updated = true;
      }

      if (updated || mergedFromUid) {
        await existingUser.save();
        console.log(`✅ Updated existing user: ${existingUser._id}`);
      }

      return { user: existingUser, mergedFromUid, shouldUseExistingFirebaseUid };
    } else {
      // Create new user
      const newUser = await User.create({
        firebaseUid,
        phone: phone || null,
        email: email || null,
        name: name || null,
      });
      console.log(`✅ Created new user: ${newUser._id}`);
      return { user: newUser, mergedFromUid: null, shouldUseExistingFirebaseUid: false };
    }
  } catch (error) {
    console.error('❌ Error in syncOrCreateUser:', error.message);
    throw error;
  }
}

module.exports = {
  getOrCreateFirebaseUserByPhone,
  generateCustomToken,
  mergeFirebaseAccounts,
  findExistingUser,
  syncOrCreateUser,
};
