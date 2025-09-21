import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { cartService } from "../services/cartService";
import {
  getWishlistItems,
  addToWishlist,
  removeFromWishlist,
  addWishlistItemToCart,
  removeFromWishlistByProductId
} from "../services/wishlistApi";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [wishlistMigrated, setWishlistMigrated] = useState(false);

  // Toast debouncing
  const lastToastTime = useRef(0);
  const showToast = (message, type = "info") => {
    const now = Date.now();
    if (now - lastToastTime.current < 500) return; // Block duplicate toasts
    lastToastTime.current = now;

    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast.info(message);
  };

  // Fetch wishlist items from API
  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const wishlistItems = await getWishlistItems();
      setSavedItems(Array.isArray(wishlistItems) ? wishlistItems : []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setSavedItems([]);
      if (error.message.includes('log in')) {
        // Don't show error toast for auth issues as user might not be logged in intentionally
        return;
      }
      showToast('Failed to load saved items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load cart data from API when user is authenticated
  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        setCartItems(response.cart?.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Fallback to empty cart on error
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Migrate localStorage cart to API when user logs in
  const migrateLocalStorageCart = async () => {
    if (!isAuthenticated || migrated) return;

    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        const localCartItems = JSON.parse(storedCart);
        if (localCartItems.length > 0) {
          // Add each item from localStorage to API
          for (const item of localCartItems) {
            try {
              await cartService.addItem(item, item.quantity);
            } catch (error) {
              console.error('Failed to migrate cart item:', error);
            }
          }
          // Clear localStorage cart after migration
          localStorage.removeItem("cart");
          showToast("Cart items migrated to your account!", "success");
        }
      }
      setMigrated(true);
      // Fetch updated cart after migration
      await fetchCart();
    } catch (error) {
      console.error('Failed to migrate cart:', error);
    }
  };

  // Migrate localStorage savedItems to API wishlist
  const migrateLocalStorageWishlist = async () => {
    if (!isAuthenticated || wishlistMigrated) return;

    try {
      const storedSavedItems = localStorage.getItem("savedItems");
      if (storedSavedItems) {
        const localSavedItems = JSON.parse(storedSavedItems);
        if (localSavedItems.length > 0) {
          // Add each saved item from localStorage to wishlist API
          for (const item of localSavedItems) {
            try {
              await addToWishlist(item._id);
            } catch (error) {
              console.error('Failed to migrate wishlist item:', error);
            }
          }
          // Clear localStorage savedItems after migration
          localStorage.removeItem("savedItems");
          showToast("Saved items migrated to your account!", "success");
        }
      }
      setWishlistMigrated(true);
      // Fetch updated wishlist after migration
      await fetchWishlist();
    } catch (error) {
      console.error('Failed to migrate wishlist:', error);
    }
  };

  // Load cart and wishlist when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      migrateLocalStorageCart();
      migrateLocalStorageWishlist();
    } else {
      // Clear cart and wishlist items when user logs out
      setCartItems([]);
      setSavedItems([]);
      setMigrated(false);
      setWishlistMigrated(false);
    }
  }, [isAuthenticated, user]);

  // **Add to Cart**
  const addToCart = async (product) => {
    if (!isAuthenticated) {
      showToast("Please login to add items to cart", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.addItem(product, 1);
      if (response.success) {
        setCartItems(response.cart?.items || []);
        showToast("Item added to cart!", "success");
      }
    } catch (error) {
      if (error.message.includes("already in cart")) {
        showToast("Item already in cart");
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // **Update Quantity**
  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await cartService.updateItem(itemId, quantity);
      if (response.success) {
        setCartItems(response.cart?.items || []);
        showToast("Quantity updated!");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // **Remove from Cart**
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await cartService.removeItem(itemId);
      if (response.success) {
        setCartItems(response.cart?.items || []);
        showToast("Item removed from cart");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // **Clear Cart**
  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await cartService.clearCart();
      if (response.success) {
        setCartItems(response.cart?.items || []);
        showToast("Cart cleared");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // **Save Item for Later**
  const saveForItemLater = async (product) => {
    if (!isAuthenticated) {
      showToast("Please login to save items", "error");
      return;
    }

    try {
      setLoading(true);
      await addToWishlist(product._id);
      
      // Remove from cart if it was in cart
      const cartItem = cartItems.find((item) => item.productId === product._id);
      if (cartItem) {
        await removeFromCart(cartItem._id);
      }
      
      // Refresh wishlist
      await fetchWishlist();
      showToast("Item saved for later!", "success");
    } catch (error) {
      if (error.response?.status === 409) {
        showToast("Item is already in your saved list.");
      } else {
        showToast("Failed to save item", "error");
        console.error('Error saving item for later:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // **Move Saved to Cart** (Updated to use API)
  const moveToCart = async (item) => {
    if (!isAuthenticated) {
      showToast("Please login to move items to cart", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Add item to cart using wishlist item data
      await addWishlistItemToCart(item);
      
      // Remove from wishlist
      await removeFromWishlist(item._id);
      
      // Refresh both cart and wishlist
      await fetchCart();
      await fetchWishlist();
      
      showToast("Item moved to cart!", "success");
    } catch (error) {
      if (error.response?.data?.message?.includes("already in your cart")) {
        showToast("This item is already in your cart.");
      } else {
        showToast("Failed to move item to cart", "error");
        console.error('Error moving item to cart:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // **Remove from Saved** (Updated to use API)
  const removeFromSaved = async (itemId, silent = false) => {
    if (!isAuthenticated) {
      if (!silent) showToast("Please login to remove items", "error");
      return;
    }

    try {
      setLoading(true);
      await removeFromWishlist(itemId);
      
      // Refresh wishlist
      await fetchWishlist();
      
      if (!silent) {
        showToast("Item removed from saved list");
      }
    } catch (error) {
      if (!silent) {
        showToast("Failed to remove item", "error");
        console.error('Error removing item from saved list:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        saveForItemLater,
        moveToCart,
        removeFromSaved,
        fetchCart,
        fetchWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
