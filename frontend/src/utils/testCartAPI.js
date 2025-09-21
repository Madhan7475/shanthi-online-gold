import { cartService } from '../services/cartService';

// Test script for cart API functionality
// This can be called from the browser console to test the API

export const testCartAPI = {
  async testGetCart() {
    console.log('Testing GET cart...');
    try {
      const result = await cartService.getCart();
      console.log('✅ GET cart success:', result);
      return result;
    } catch (error) {
      console.error('❌ GET cart error:', error.message);
      return null;
    }
  },

  async testAddItem(productId, quantity = 1) {
    console.log(`Testing ADD item (${productId}, qty: ${quantity})...`);
    try {
      const result = await cartService.addItem(productId, quantity);
      console.log('✅ ADD item success:', result);
      return result;
    } catch (error) {
      console.error('❌ ADD item error:', error.message);
      return null;
    }
  },

  async testUpdateItem(itemId, quantity) {
    console.log(`Testing UPDATE item (${itemId}, qty: ${quantity})...`);
    try {
      const result = await cartService.updateItem(itemId, quantity);
      console.log('✅ UPDATE item success:', result);
      return result;
    } catch (error) {
      console.error('❌ UPDATE item error:', error.message);
      return null;
    }
  },

  async testRemoveItem(itemId) {
    console.log(`Testing REMOVE item (${itemId})...`);
    try {
      const result = await cartService.removeItem(itemId);
      console.log('✅ REMOVE item success:', result);
      return result;
    } catch (error) {
      console.error('❌ REMOVE item error:', error.message);
      return null;
    }
  },

  async testClearCart() {
    console.log('Testing CLEAR cart...');
    try {
      const result = await cartService.clearCart();
      console.log('✅ CLEAR cart success:', result);
      return result;
    } catch (error) {
      console.error('❌ CLEAR cart error:', error.message);
      return null;
    }
  },

  async testGetCartCount() {
    console.log('Testing GET cart count...');
    try {
      const result = await cartService.getCartCount();
      console.log('✅ GET cart count success:', result);
      return result;
    } catch (error) {
      console.error('❌ GET cart count error:', error.message);
      return null;
    }
  },

  async runAllTests(testProductId = '672b123456789012345678ab') {
    console.log('🧪 Running all cart API tests...');
    console.log('Note: Make sure you are logged in to test these APIs');
    
    // Test getting cart
    await this.testGetCart();
    
    // Test getting cart count
    await this.testGetCartCount();
    
    // Test adding item (use a real product ID in your database)
    await this.testAddItem(testProductId, 2);
    
    // Test getting cart after adding
    const cartAfterAdd = await this.testGetCart();
    
    if (cartAfterAdd && cartAfterAdd.cart && cartAfterAdd.cart.items && cartAfterAdd.cart.items.length > 0) {
      const firstItem = cartAfterAdd.cart.items[0];
      
      // Test updating quantity
      await this.testUpdateItem(firstItem._id, 3);
      
      // Test removing item
      await this.testRemoveItem(firstItem._id);
    }
    
    // Test clearing cart
    await this.testClearCart();
    
    console.log('🏁 All tests completed');
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.testCartAPI = testCartAPI;
  console.log('🛠️ Cart API test utilities available at window.testCartAPI');
  console.log('Example: testCartAPI.runAllTests("your-product-id")');
}

export default testCartAPI;
