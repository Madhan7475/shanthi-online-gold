import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      return [];
    }
  });

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const storedSavedItems = localStorage.getItem("savedItems");
      return storedSavedItems ? JSON.parse(storedSavedItems) : [];
    } catch (error) {
      return [];
    }
  });

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

  // Sync cart & savedItems to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("savedItems", JSON.stringify(savedItems));
  }, [savedItems]);

  // **Add to Cart**
  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      if (exists) {
        showToast("Item already in cart");
        return prev;
      }
      showToast("Item added to cart!", "success");
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // **Update Quantity**
  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
    showToast("Quantity updated!");
  };

  // **Remove from Cart**
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
    showToast("Item removed from cart");
  };

  // **Clear Cart**
  const clearCart = () => {
    setCartItems([]);
    showToast("Cart cleared");
  };

  // **Save Item for Later**
  const saveForItemLater = (product) => {
    const isAlreadySaved = savedItems.some((item) => item._id === product._id);
    if (isAlreadySaved) {
      showToast("Item is already in your saved list.");
      return;
    }
    setSavedItems((prev) => [...prev, product]);
    setCartItems((prev) => prev.filter((item) => item._id !== product._id));
    showToast("Item saved for later!", "success");
  };

  // **Move Saved to Cart**
  const moveToCart = (item) => {
    const existsInCart = cartItems.some((cartItem) => cartItem._id === item._id);
    if (existsInCart) {
      showToast("This item is already in your cart.");
      return;
    }
    setCartItems((prev) => [...prev, { ...item, quantity: 1 }]);
    removeFromSaved(item._id);
    showToast("Item moved to cart!", "success");
  };

  // **Remove from Saved**
  const removeFromSaved = (itemId) => {
    setSavedItems((prev) => prev.filter((item) => item._id !== itemId));
    showToast("Item removed from saved list");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        saveForItemLater,
        moveToCart,
        removeFromSaved,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
