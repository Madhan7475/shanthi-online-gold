# 🗄️ Database Migration Guide

## Production to Staging Database Migration

This guide helps you dump your production MongoDB database and restore it to staging.

---

## 📋 Prerequisites

### 1. Install MongoDB Database Tools

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb-database-tools
```

**Windows:**
Download from: https://www.mongodb.com/try/download/database-tools

### 2. Verify Installation

```bash
mongodump --version
mongorestore --version
```

You should see version information for both tools.

### 3. Verify Environment Files

Make sure you have:
- `backend/.env.prod` - Production MongoDB URI
- `backend/.env.staging` - Staging MongoDB URI

---

## 🚀 Migration Methods

### Method 1: Full Interactive Migration (Recommended)

This method includes safety checks, backups, and verification.

```bash
# Make script executable
chmod +x scripts/migrate-prod-to-staging.sh

# Run migration
./scripts/migrate-prod-to-staging.sh
```

**Features:**
- ✅ Creates timestamped backups
- ✅ Multiple confirmation prompts
- ✅ Verifies collections after migration
- ✅ Detailed progress output
- ✅ Keeps backup for rollback

---

### Method 2: Quick Migration

Fast migration without verbose output. Use when you're confident.

```bash
# Make script executable
chmod +x scripts/quick-migrate.sh

# Run migration
./scripts/quick-migrate.sh
```

---

### Method 3: Manual Migration

If you prefer manual control:

#### Step 1: Dump Production Database

```bash
# Load production URI
PROD_URI=$(grep "^MONGO_URI=" backend/.env.prod | cut -d '=' -f2- | tr -d '"' | tr -d "'")

# Create backup directory
mkdir -p backups/manual_$(date +%Y%m%d_%H%M%S)

# Dump production
mongodump --uri="$PROD_URI" --out="backups/manual_$(date +%Y%m%d_%H%M%S)"
```

#### Step 2: Restore to Staging

```bash
# Load staging URI
STAGING_URI=$(grep "^MONGO_URI=" backend/.env.staging | cut -d '=' -f2- | tr -d '"' | tr -d "'")

# Restore to staging (replace BACKUP_DIR with your actual backup directory)
mongorestore --uri="$STAGING_URI" --drop backups/manual_YYYYMMDD_HHMMSS/SHANTHIONLINEGOLD
```

---

## 📊 What Gets Migrated

All collections in your production database:

- ✅ **products** - All product data
- ✅ **categories** - Category structure
- ✅ **users** - User accounts
- ✅ **orders** - Order history
- ✅ **carts** - Shopping carts
- ✅ **wishlists** - User wishlists
- ✅ **payments** - Payment records
- ✅ **makingcharges** - Making charge configurations
- ✅ **invoices** - Generated invoices
- ✅ **notificationcampaigns** - Notification data
- ✅ **notificationlogs** - Notification logs
- ✅ **userdevices** - Device tokens
- ✅ All other collections

---

## ⚠️ Important Notes

### Before Migration

1. **Stop staging application** (optional but recommended):
   ```bash
   # If running locally
   # Stop backend server
   
   # If running on VPS with Docker
   ssh user@vps
   cd ~/shanthi-online-gold
   docker-compose down
   ```

2. **Backup staging database** (if it has important data):
   ```bash
   STAGING_URI=$(grep "^MONGO_URI=" backend/.env.staging | cut -d '=' -f2- | tr -d '"' | tr -d "'")
   mongodump --uri="$STAGING_URI" --out="backups/staging_backup_$(date +%Y%m%d)"
   ```

### After Migration

1. **Update staging database name** in `.env.staging` if needed:
   ```bash
   # If your production database is named "SHANTHIONLINEGOLD"
   # Update staging URI to include database name:
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/SHANTHIONLINEGOLD?...
   ```

2. **Restart staging application**:
   ```bash
   # If running locally
   cd backend
   npm start
   
   # If running on VPS with Docker
   ssh user@vps
   cd ~/shanthi-online-gold
   docker-compose up -d
   ```

3. **Test staging application** thoroughly:
   - Login works
   - Products display correctly
   - Cart functionality
   - Orders are visible
   - Search works

---

## 🔍 Verification

### Check Collection Counts

Using `mongosh`:

```bash
# Install mongosh if not already installed
brew install mongosh

# Connect to staging
STAGING_URI=$(grep "^MONGO_URI=" backend/.env.staging | cut -d '=' -f2- | tr -d '"' | tr -d "'")

mongosh "$STAGING_URI/SHANTHIONLINEGOLD" --eval "
  db.getCollectionNames().forEach(coll => {
    print(coll + ': ' + db[coll].countDocuments() + ' documents');
  });
"
```

### Compare Counts

```bash
# Production counts
mongosh "$PROD_URI/SHANTHIONLINEGOLD" --eval "print('Products: ' + db.products.countDocuments())"

# Staging counts
mongosh "$STAGING_URI/SHANTHIONLINEGOLD" --eval "print('Products: ' + db.products.countDocuments())"
```

They should match!

---

## 🔄 Common Scenarios

### Scenario 1: Different Database Names

If production uses `SHANTHIONLINEGOLD` but you want staging to use `shanthi_staging`:

```bash
# Dump production
mongodump --uri="$PROD_URI" --out="backups/prod_dump"

# Restore with namespace change
mongorestore --uri="$STAGING_URI" \
  --nsFrom="SHANTHIONLINEGOLD.*" \
  --nsTo="shanthi_staging.*" \
  --drop \
  backups/prod_dump/SHANTHIONLINEGOLD
```

### Scenario 2: Migrate Specific Collections Only

To migrate only products and categories:

```bash
# Dump specific collections
mongodump --uri="$PROD_URI" \
  --db=SHANTHIONLINEGOLD \
  --collection=products \
  --out="backups/prod_partial"

mongodump --uri="$PROD_URI" \
  --db=SHANTHIONLINEGOLD \
  --collection=categories \
  --out="backups/prod_partial"

# Restore
mongorestore --uri="$STAGING_URI" --drop backups/prod_partial
```

### Scenario 3: Exclude Sensitive Collections

To migrate everything EXCEPT user data:

```bash
# Dump production
mongodump --uri="$PROD_URI" --out="backups/prod_dump"

# Remove sensitive collections
rm -rf backups/prod_dump/SHANTHIONLINEGOLD/users.*
rm -rf backups/prod_dump/SHANTHIONLINEGOLD/orders.*
rm -rf backups/prod_dump/SHANTHIONLINEGOLD/payments.*

# Restore remaining
mongorestore --uri="$STAGING_URI" --drop backups/prod_dump/SHANTHIONLINEGOLD
```

---

## 📦 Backup Management

### List Backups

```bash
ls -lh backups/
```

### Restore from Backup

```bash
# Restore from a specific backup
mongorestore --uri="$STAGING_URI" --drop backups/prod_dump_20241103_143022/SHANTHIONLINEGOLD
```

### Clean Old Backups

```bash
# Keep only last 7 days
find backups/ -type d -mtime +7 -exec rm -rf {} +

# Keep only last 5 backups
ls -t backups/ | tail -n +6 | xargs -I {} rm -rf backups/{}
```

### Archive Backups

```bash
# Compress a backup
tar -czf backups/prod_dump_20241103.tar.gz backups/prod_dump_20241103_143022/

# Extract later
tar -xzf backups/prod_dump_20241103.tar.gz
```

---

## 🆘 Troubleshooting

### Error: "mongodump: command not found"

**Solution:** Install MongoDB Database Tools (see Prerequisites above)

### Error: "authentication failed"

**Solution:** Verify your MongoDB URIs are correct in `.env.prod` and `.env.staging`

```bash
# Test connection
mongosh "$PROD_URI" --eval "db.runCommand({ connectionStatus: 1 })"
```

### Error: "network timeout"

**Solution:** 
1. Check your internet connection
2. Verify MongoDB Atlas network access (whitelist your IP)
3. Try with increased timeout:
   ```bash
   mongodump --uri="$PROD_URI" --out="backups/dump" --connectTimeoutMS=30000
   ```

### Error: "insufficient space"

**Solution:** 
1. Check available disk space: `df -h`
2. Clean old backups: `rm -rf backups/old_*`
3. Use gzip compression:
   ```bash
   mongodump --uri="$PROD_URI" --gzip --out="backups/dump_compressed"
   ```

### Migration is slow

**Solution:** 
1. Compress during dump: `--gzip`
2. Increase parallel collections:
   ```bash
   mongodump --uri="$PROD_URI" --numParallelCollections=4 --out="backups/dump"
   mongorestore --uri="$STAGING_URI" --numParallelCollections=4 --drop backups/dump
   ```

---

## 🔒 Security Best Practices

1. **Never commit** `.env.prod` or `.env.staging` to git
2. **Encrypt backups** containing production data:
   ```bash
   # Encrypt
   tar -czf - backups/prod_dump | openssl enc -aes-256-cbc -e > prod_backup_encrypted.tar.gz.enc
   
   # Decrypt
   openssl enc -aes-256-cbc -d -in prod_backup_encrypted.tar.gz.enc | tar xz
   ```
3. **Delete backups** after migration if not needed
4. **Rotate credentials** regularly
5. **Limit network access** in MongoDB Atlas

---

## 📞 Quick Reference

### One-Line Commands

**Full migration:**
```bash
./scripts/migrate-prod-to-staging.sh
```

**Quick migration:**
```bash
./scripts/quick-migrate.sh
```

**Manual dump:**
```bash
mongodump --uri="$(grep MONGO_URI backend/.env.prod | cut -d'=' -f2-)" --out="backups/dump_$(date +%Y%m%d)"
```

**Manual restore:**
```bash
mongorestore --uri="$(grep MONGO_URI backend/.env.staging | cut -d'=' -f2-)" --drop backups/dump_YYYYMMDD/DBNAME
```

---

## ✅ Post-Migration Checklist

- [ ] Verify all collections migrated
- [ ] Check document counts match
- [ ] Test application functionality
- [ ] Verify products display correctly
- [ ] Test user authentication
- [ ] Test cart and wishlist
- [ ] Test order creation
- [ ] Check admin functions
- [ ] Verify search functionality
- [ ] Test payment flow
- [ ] Keep backup for safety
- [ ] Update staging URI if needed
- [ ] Restart staging services
- [ ] Monitor logs for errors

---

**🎉 Your staging database is now in sync with production!**
