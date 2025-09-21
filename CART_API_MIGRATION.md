# Cart API Migration Guide

This document describes the migration from localStorage-based cart management to API-based cart management.

## Overview

The cart system has been updated to use backend API endpoints instead of localStorage for cart management. This provides better data persistence, user authentication, and synchronization across devices.

## Changes Made

### 1. New Cart API Service (`frontend/src/services/cartService.js`)

Created a comprehensive API service with the following methods:
- `getCart()` - Fetch user's cart items
- `getCartCount()` - Get cart items count
- `addItem(productId, quantity)` - Add item to cart
- `updateItem(itemId, quantity)` - Update cart item quantity
- `removeItem(itemId)` - Remove item from cart
- `clearCart()` - Clear entire cart
- `checkout(orderData)` - Process checkout

### 2. Updated Cart Context (`frontend/src/context/CartContext.jsx`)

**Key Changes:**
- Replaced localStorage operations with API calls
- Added authentication requirements for all cart operations
- Implemented automatic migration from localStorage to API for existing users
- Added loading states for better UX
- Maintained backward compatibility with saved items (still using localStorage)

**Migration Logic:**
- When a user logs in, existing localStorage cart items are automatically migrated to the API
- After successful migration, localStorage cart is cleared
- User receives a success notification about the migration

### 3. Updated Pages

**CartPage.jsx:**
- Added `CartAuthGuard` component for authentication protection
- Added loading states during API operations
- Improved error handling

**CheckoutPage.jsx:**
- Updated to use new cart checkout API
- Added `CartAuthGuard` component
- Integrated with existing PhonePe payment flow

### 4. New Components

**CartAuthGuard.jsx:**
- Protects cart-related pages/components
- Shows login prompt for unauthenticated users
- Provides fallback UI with login and continue shopping options

## API Endpoints Used

All endpoints require authentication (Firebase token or JWT):

- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `POST /api/cart/checkout` - Process checkout (creates order and clears cart)
- `GET /api/cart/count` - Get cart items count

## User Experience

### For Existing Users
1. Users with items in localStorage will see their cart items migrated automatically upon login
2. A success toast notification confirms the migration
3. Cart items are then managed through the API

### For New Users
1. Cart operations require authentication
2. Users see a login prompt when attempting to add items without authentication
3. All cart data is stored in the backend database

### Authentication Requirements
- All cart operations require user authentication
- Unauthenticated users see appropriate prompts to sign in
- Cart data is tied to user accounts for cross-device synchronization

## Error Handling

- Network errors show user-friendly messages
- API failures fallback gracefully
- Loading states prevent UI issues during operations
- Proper error boundaries protect the application

## Development Testing

A test utility is available in development mode:

```javascript
// Available in browser console during development
testCartAPI.runAllTests('your-product-id');

// Individual test methods
testCartAPI.testGetCart();
testCartAPI.testAddItem('productId', 2);
testCartAPI.testUpdateItem('itemId', 3);
testCartAPI.testRemoveItem('itemId');
testCartAPI.testClearCart();
```

## Backward Compatibility

- Saved items still use localStorage (as they don't require backend persistence)
- Existing cart UI/UX remains unchanged
- All existing components continue to work without modification
- Authentication flow remains the same

## Benefits

1. **Data Persistence**: Cart data survives browser sessions and device switches
2. **Authentication Integration**: Cart data is tied to user accounts
3. **Scalability**: Backend can handle complex cart operations
4. **Analytics**: Server-side cart data enables better business insights
5. **Performance**: Reduced localStorage operations
6. **Security**: Cart operations are authenticated and validated
7. **Cross-device Sync**: Users can access their cart from any device

## Migration Process

The migration is automatic and seamless:

1. User logs in with existing localStorage cart items
2. System detects localStorage cart data
3. Each item is added to the backend cart via API
4. localStorage cart is cleared after successful migration
5. User receives confirmation notification
6. All future cart operations use the API

## Monitoring

- All cart operations include proper error logging
- Success/failure rates can be monitored through API logs
- User migration success can be tracked through console logs
