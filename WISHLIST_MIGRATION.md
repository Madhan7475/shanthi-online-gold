# Wishlist API Migration

This document outlines the migration from localStorage-based saved items to API-based wishlist functionality.

## Changes Made

### 1. Backend API (Already Implemented)
- **Endpoints**: `/api/wishlist/*` 
- **Authentication**: Uses `verifyFirebaseToken` middleware
- **Database**: MongoDB with Wishlist model

### 2. Frontend Updates

#### 2.1 New API Service (`/src/services/wishlistApi.js`)
- `getWishlistItems()` - Fetch user's wishlist
- `addToWishlist(productId)` - Add product to wishlist
- `removeFromWishlist(itemId)` - Remove item from wishlist
- `addWishlistItemToCart(item)` - Add wishlist item to cart
- `moveWishlistItemToCart(itemId)` - Move item to cart via backend
- `getWishlistCount()` - Get wishlist count
- `checkProductInWishlist(productId)` - Check if product is in wishlist

#### 2.2 Updated CartContext (`/src/context/CartContext.jsx`)
- Replaced localStorage `savedItems` with API calls
- Added automatic migration from localStorage to API on login
- Updated all wishlist functions to use API:
  - `saveForItemLater()` - Now async, calls wishlist API
  - `moveToCart()` - Now async, uses cart and wishlist APIs
  - `removeFromSaved()` - Now async, calls wishlist API
- Added `fetchWishlist()` function for manual refresh
- Added loading states and error handling

#### 2.3 Updated SavedItemsPage (`/src/pages/SavedItemsPage.jsx`)
- Added automatic wishlist fetching on component mount
- Updated data structure handling (supports both `item.product.title` and `item.title`)
- Added loading states for buttons and page content
- Improved error handling with user feedback

#### 2.4 Updated Cart Service (`/src/services/cartService.js`)
- Enhanced `addItem()` to accept full product objects or just product ID
- Backend handles product data fetching when only ID is provided

## Migration Strategy

### Automatic Migration
- When user logs in, existing localStorage `savedItems` are automatically migrated to the API
- Migration happens only once per session
- localStorage is cleared after successful migration
- User receives success notification

### Graceful Fallback
- If API is unavailable, user sees appropriate error messages
- Authentication errors are handled gracefully
- Loading states provide feedback during API operations

## Authentication Requirements
- Users must be logged in to:
  - Save items for later
  - View saved items
  - Move saved items to cart
  - Remove saved items
- Unauthenticated users see appropriate login prompts

## Data Structure

### API Response Format
```json
{
  "_id": "wishlistItemId",
  "userId": "firebaseUid",
  "productId": "productObjectId",
  "product": {
    "title": "Product Name",
    "price": 1000,
    "images": ["image1.jpg"],
    "category": "Gold",
    "karatage": "22K",
    // ... other product fields
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Testing Checklist

### Pre-Migration (localStorage)
- [ ] Save items to localStorage
- [ ] Verify localStorage data exists
- [ ] User not logged in

### Migration Process
- [ ] User logs in
- [ ] Migration success message appears
- [ ] localStorage `savedItems` is cleared
- [ ] Saved items appear in API-backed list

### Post-Migration Functionality
- [ ] View saved items page works
- [ ] Save new items from product pages
- [ ] Move items to cart
- [ ] Remove items from saved list
- [ ] Saved items counter in navigation updates
- [ ] Loading states work properly
- [ ] Error handling works (network issues, auth issues)

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Performance
- [ ] API calls are properly debounced
- [ ] Loading states don't block UI
- [ ] Error recovery works properly

## Rollback Plan

If issues arise, the system can be rolled back by:
1. Reverting CartContext to localStorage implementation
2. Disabling wishlist API endpoints
3. Users will lose API-stored wishlist data but can rebuild locally

## Future Enhancements

1. **Bulk Operations**: Add, remove, or move multiple items at once
2. **Wishlist Sharing**: Share wishlist with others
3. **Wishlist Analytics**: Track popular saved items
4. **Push Notifications**: Notify users of price changes on saved items
5. **Offline Support**: Cache wishlist for offline viewing
