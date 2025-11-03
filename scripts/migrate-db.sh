#!/bin/bash

# MongoDB Database Migration Script
# Usage: ./migrate-db.sh [options]
# Options:
#   --collection <name>  : Migrate only a specific collection (e.g., products, users, orders)
#   --all               : Migrate all collections (default)
#   --dry-run           : Show what would be migrated without actually doing it
#   --help              : Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
COLLECTION=""
DRY_RUN=false
MIGRATE_ALL=true

# MongoDB connection strings
PROD_URI="mongodb+srv://visualfry:TCTNgksFE20ajB0z@cluster0.haaic6h.mongodb.net/SHANTHIONLINEGOLD?retryWrites=true&w=majority&appName=Cluster0"
STAGING_URI="mongodb+srv://hardikdce7008_db_user:solkn6fLWM4PISGx@cluster0.rqjhn0p.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"

PROD_DB="SHANTHIONLINEGOLD"
STAGING_DB="SHANTHIONLINEGOLD"

DUMP_DIR="/tmp/mongodb_migration_$(date +%Y%m%d_%H%M%S)"

# Available collections
AVAILABLE_COLLECTIONS=(
    "products"
    "categories"
    "users"
    "orders"
    "carts"
    "wishlists"
    "payments"
    "invoices"
    "makingcharges"
    "notificationcampaigns"
    "notificationlogs"
    "notificationtemplates"
    "topicnotificationlogs"
    "userdevices"
)

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

print_error() {
    echo -e "${RED}✗ ${NC}$1"
}

# Function to show help
show_help() {
    echo "MongoDB Database Migration Script"
    echo ""
    echo "Usage: ./migrate-db.sh [options]"
    echo ""
    echo "Options:"
    echo "  --collection <name>  Migrate only a specific collection"
    echo "  --all               Migrate all collections (default)"
    echo "  --dry-run           Show what would be migrated without actually doing it"
    echo "  --help              Show this help message"
    echo ""
    echo "Available collections:"
    for col in "${AVAILABLE_COLLECTIONS[@]}"; do
        echo "  - $col"
    done
    echo ""
    echo "Examples:"
    echo "  ./migrate-db.sh --collection products"
    echo "  ./migrate-db.sh --collection users"
    echo "  ./migrate-db.sh --all"
    echo "  ./migrate-db.sh --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --collection)
            COLLECTION="$2"
            MIGRATE_ALL=false
            shift 2
            ;;
        --all)
            MIGRATE_ALL=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate collection name if specified
if [ "$MIGRATE_ALL" = false ] && [ -n "$COLLECTION" ]; then
    VALID=false
    for col in "${AVAILABLE_COLLECTIONS[@]}"; do
        if [ "$col" = "$COLLECTION" ]; then
            VALID=true
            break
        fi
    done
    
    if [ "$VALID" = false ]; then
        print_error "Invalid collection name: $COLLECTION"
        echo ""
        echo "Available collections:"
        for col in "${AVAILABLE_COLLECTIONS[@]}"; do
            echo "  - $col"
        done
        exit 1
    fi
fi

# Check if MongoDB tools are installed
if ! command -v mongodump &> /dev/null || ! command -v mongorestore &> /dev/null; then
    print_error "MongoDB Database Tools are not installed!"
    echo ""
    echo "Install using:"
    echo "  macOS:   brew install mongodb-database-tools"
    echo "  Ubuntu:  sudo apt-get install mongodb-database-tools"
    echo "  Windows: Download from https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Display migration plan
echo ""
echo "=================================="
echo "  MongoDB Migration Plan"
echo "=================================="
echo ""
print_info "Source:      Production (${PROD_DB})"
print_info "Destination: Staging (${STAGING_DB})"
echo ""

if [ "$MIGRATE_ALL" = true ]; then
    print_info "Mode:        Migrate ALL collections"
    echo ""
    echo "Collections to migrate:"
    for col in "${AVAILABLE_COLLECTIONS[@]}"; do
        echo "  • $col"
    done
else
    print_info "Mode:        Migrate ONLY '${COLLECTION}' collection"
fi

echo ""
print_info "Dump location: ${DUMP_DIR}"

if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No actual migration will occur"
fi

echo ""
echo "=================================="
echo ""

# Ask for confirmation unless dry run
if [ "$DRY_RUN" = false ]; then
    read -p "Do you want to proceed? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_warning "Migration cancelled by user"
        exit 0
    fi
    echo ""
fi

if [ "$DRY_RUN" = true ]; then
    print_success "Dry run complete! The above collections would be migrated."
    exit 0
fi

# Create dump directory
print_info "Creating dump directory..."
mkdir -p "$DUMP_DIR"
print_success "Dump directory created"
echo ""

# Dump from production
if [ "$MIGRATE_ALL" = true ]; then
    print_info "Dumping ALL collections from production..."
    mongodump --uri="$PROD_URI" --out="$DUMP_DIR"
else
    print_info "Dumping '${COLLECTION}' collection from production..."
    mongodump --uri="$PROD_URI" --collection="$COLLECTION" --out="$DUMP_DIR"
fi

if [ $? -eq 0 ]; then
    print_success "Dump completed successfully"
else
    print_error "Dump failed!"
    exit 1
fi
echo ""

# Count documents
DUMP_PATH="${DUMP_DIR}/${PROD_DB}"
if [ "$MIGRATE_ALL" = true ]; then
    print_info "Collections dumped:"
    for col in "${AVAILABLE_COLLECTIONS[@]}"; do
        if [ -f "${DUMP_PATH}/${col}.bson" ]; then
            SIZE=$(du -h "${DUMP_PATH}/${col}.bson" | cut -f1)
            echo "  • ${col} (${SIZE})"
        fi
    done
else
    if [ -f "${DUMP_PATH}/${COLLECTION}.bson" ]; then
        SIZE=$(du -h "${DUMP_PATH}/${COLLECTION}.bson" | cut -f1)
        print_info "Dumped: ${COLLECTION} (${SIZE})"
    fi
fi
echo ""

# Restore to staging
if [ "$MIGRATE_ALL" = true ]; then
    print_info "Restoring ALL collections to staging..."
    mongorestore --uri="$STAGING_URI" --drop "$DUMP_PATH"
else
    print_info "Restoring '${COLLECTION}' collection to staging..."
    mongorestore --uri="$STAGING_URI" --collection="$COLLECTION" --drop "${DUMP_PATH}/${COLLECTION}.bson"
fi

if [ $? -eq 0 ]; then
    print_success "Restore completed successfully"
else
    print_error "Restore failed!"
    exit 1
fi
echo ""

# Cleanup
print_info "Cleaning up dump files..."
rm -rf "$DUMP_DIR"
print_success "Cleanup completed"
echo ""

# Final summary
echo "=================================="
echo "  Migration Complete! ✓"
echo "=================================="
echo ""
if [ "$MIGRATE_ALL" = true ]; then
    print_success "All collections have been migrated from production to staging"
else
    print_success "'${COLLECTION}' collection has been migrated from production to staging"
fi
echo ""
print_warning "Note: Existing data in staging was replaced (--drop flag used)"
echo ""
