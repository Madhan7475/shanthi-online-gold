# Database Migration Guide

## Overview
This guide helps you migrate collections from production to staging MongoDB using a single, flexible script.

## Prerequisites

### Install MongoDB Database Tools

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb-database-tools
```

**Windows:**
Download from [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools)

### Verify Installation
```bash
mongodump --version
mongorestore --version
```

## Using the Migration Script

The single `migrate-db.sh` script can handle all your migration needs.

### Basic Usage

```bash
# Show help and available options
./scripts/migrate-db.sh --help

# Migrate ALL collections (with confirmation)
./scripts/migrate-db.sh --all

# Migrate only products collection
./scripts/migrate-db.sh --collection products

# Migrate only users collection
./scripts/migrate-db.sh --collection users

# Dry run to see what would be migrated
./scripts/migrate-db.sh --dry-run
./scripts/migrate-db.sh --collection products --dry-run
```

### Available Collections

The script supports migrating these collections:
- products
- categories
- users
- orders
- carts
- wishlists
- payments
- invoices
- makingcharges
- notificationcampaigns
- notificationlogs
- notificationtemplates
- topicnotificationlogs
- userdevices

### Examples

**Migrate only products:**
```bash
./scripts/migrate-db.sh --collection products
```

**Migrate only orders:**
```bash
./scripts/migrate-db.sh --collection orders
```

**Migrate everything:**
```bash
./scripts/migrate-db.sh --all
```

**Test before running:**
```bash
./scripts/migrate-db.sh --collection products --dry-run
```

## What the Script Does

1. ✓ Validates MongoDB tools installation
2. ✓ Shows you what will be migrated
3. ✓ Asks for confirmation (unless --dry-run)
4. ✓ Dumps data from production
5. ✓ Shows collection sizes
6. ✓ Restores to staging (with --drop to replace existing data)
7. ✓ Cleans up temporary files
8. ✓ Provides colored, easy-to-read output

## Verification

After migration, verify the data:

```bash
# Connect to staging and check collection
mongosh "mongodb+srv://cluster0.rqjhn0p.mongodb.net/SHANTHIONLINEGOLD" --username shanthionlinegold
```

Then in the MongoDB shell:
```javascript
// Check products
db.products.countDocuments()
db.products.findOne()

// Check other collections
db.users.countDocuments()
db.orders.countDocuments()
```

## Troubleshooting

### Permission Issues
```bash
chmod +x scripts/migrate-db.sh
```

### Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify credentials are correct
- Check network connectivity

### Large Dataset
The script handles large datasets automatically. MongoDB tools stream data efficiently.

### Invalid Collection Name
The script will show you available collections if you specify an invalid name.

## Safety Notes

⚠️ **Important:**
- The `--drop` flag removes existing data in staging before restore
- Always use `--dry-run` first to see what will happen
- Backup staging before migration if needed
- The script creates timestamped dumps in `/tmp/` and cleans them up after

## Environment Variables

- **Production**: `cluster0.haaic6h.mongodb.net/SHANTHIONLINEGOLD`
- **Staging**: `cluster0.rqjhn0p.mongodb.net/SHANTHIONLINEGOLD`

## Quick Reference

```bash
# Most common use cases:
./scripts/migrate-db.sh --collection products    # Migrate products only
./scripts/migrate-db.sh --collection orders      # Migrate orders only
./scripts/migrate-db.sh --all                    # Migrate everything
./scripts/migrate-db.sh --dry-run               # Preview what would happen
```
