import axiosInstance from '../utils/axiosInstance';

// API service functions for cart operations
export const cartService = {
  // Get user's cart items
  getCart: async () => {
    try {
      const response = await axiosInstance.get('/cart');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  },

  // Get cart items count
  getCartCount: async () => {
    try {
      const response = await axiosInstance.get('/cart/count');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart count');
    }
  },

  // Add item to cart
  addItem: async (productData, quantity = 1) => {
    try {
      // If productData is just an ID, we need to fetch product details
      let itemData;
      if (typeof productData === 'string') {
        // If it's just a productId, we need the full product data from the backend
        // This will be handled by the backend when it fetches the product by ID
        itemData = { productId: productData, quantity };
      } else {
        // Full product object passed
        itemData = {
          productId: productData._id,
          name: productData.title,
          price: productData.price,
          image: productData.images?.[0],
          quantity,
          category: productData.category,
          description: productData.description,
          weight: productData.grossWeight,
          purity: productData.karatage,
        };
      }
      
      const response = await axiosInstance.post('/cart', itemData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  },

  // Update cart item quantity
  updateItem: async (itemId, quantity) => {
    try {
      const response = await axiosInstance.put(`/cart/${itemId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  },

  // Remove item from cart
  removeItem: async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/cart/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await axiosInstance.delete('/cart');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  },

  // Process checkout
  checkout: async (orderData) => {
    try {
      const response = await axiosInstance.post('/cart/checkout', orderData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process checkout');
    }
  }
};
