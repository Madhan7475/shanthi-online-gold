import axiosInstance from '../utils/axiosInstance';

// Get all wishlist items
export const getWishlistItems = async () => {
  try {
    const response = await axiosInstance.get('/wishlist');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    // Return empty array if there's an error so the UI can handle gracefully
    if (error.response?.status === 401) {
      throw new Error('Please log in to view your wishlist');
    }
    throw error;
  }
};

// Add item to wishlist
export const addToWishlist = async (productId) => {
  try {
    const response = await axiosInstance.post('/wishlist', { productId });
    return response.data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

// Remove item from wishlist by wishlist item ID
export const removeFromWishlist = async (itemId) => {
  try {
    const response = await axiosInstance.delete(`/wishlist/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

// Remove item from wishlist by product ID
export const removeFromWishlistByProductId = async (productId) => {
  try {
    const response = await axiosInstance.delete(`/wishlist/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from wishlist by product ID:', error);
    throw error;
  }
};

// Move wishlist item to cart
export const moveWishlistItemToCart = async (itemId, quantity = 1, size = null) => {
  try {
    const response = await axiosInstance.post('/wishlist/move-to-cart', {
      itemId,
      quantity,
      size
    });
    return response.data;
  } catch (error) {
    console.error('Error moving wishlist item to cart:', error);
    throw error;
  }
};

// Add wishlist item directly to cart API
export const addWishlistItemToCart = async (wishlistItem) => {
  try {
    const cartData = {
      productId: wishlistItem.productId?._id || wishlistItem.productId,
      name: wishlistItem.product?.title || wishlistItem.title,
      price: wishlistItem.product?.price || wishlistItem.price,
      image: wishlistItem.product?.images?.[0] || wishlistItem.images?.[0],
      quantity: 1,
      category: wishlistItem.product?.category || wishlistItem.category,
      description: wishlistItem.product?.description || wishlistItem.description,
      weight: wishlistItem.product?.grossWeight || wishlistItem.grossWeight,
      purity: wishlistItem.product?.karatage || wishlistItem.karatage,
    };

    const response = await axiosInstance.post('/cart', cartData);
    return response.data;
  } catch (error) {
    console.error('Error adding wishlist item to cart:', error);
    throw error;
  }
};

// Get wishlist items count
export const getWishlistCount = async () => {
  try {
    const response = await axiosInstance.get('/wishlist/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    throw error;
  }
};

// Check if product is in wishlist
export const checkProductInWishlist = async (productId) => {
  try {
    const response = await axiosInstance.post('/wishlist/check', { productId });
    return response.data;
  } catch (error) {
    console.error('Error checking product in wishlist:', error);
    throw error;
  }
};
