import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage or an empty array
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      return [];
    }
  });

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const storedSavedItems = localStorage.getItem("savedItems");
      return storedSavedItems ? JSON.parse(storedSavedItems) : [];
    } catch (error) {
      console.error("Failed to parse saved items from localStorage", error);
      return [];
    }
  });

  // ✅ Effect to SAVE cartItems to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  // ✅ Effect to SAVE savedItems to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("savedItems", JSON.stringify(savedItems));
    } catch (error) {
      console.error("Failed to save saved items to localStorage", error);
    }
  }, [savedItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      if (exists) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const saveForItemLater = (itemId) => {
    const itemToSave = cartItems.find(item => item._id === itemId);
    if (itemToSave) {
      setSavedItems(prev => {
        const exists = prev.find(item => item._id === itemId);
        if (exists) return prev;
        return [...prev, itemToSave];
      });
      removeFromCart(itemId);
      toast.info("Item saved for later!");
    }
  };

  const moveToCart = (item) => {
    addToCart(item);
    removeFromSaved(item._id);
  };

  const removeFromSaved = (itemId) => {
    setSavedItems(prev => prev.filter(item => item._id !== itemId));
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        savedItems,
        saveForItemLater,
        moveToCart,
        removeFromSaved
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
