import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]); // ✅ New state for saved items

  // Load cart and saved items from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(storedCart);
      const storedSavedItems = JSON.parse(localStorage.getItem("savedItems")) || [];
      setSavedItems(storedSavedItems);
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ Sync saved items to localStorage
  useEffect(() => {
    localStorage.setItem("savedItems", JSON.stringify(savedItems));
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

  // ✅ New function to save an item for later
  const saveForItemLater = (itemId) => {
    const itemToSave = cartItems.find(item => item._id === itemId);
    if (itemToSave) {
      // Add to saved items (if not already there)
      setSavedItems(prev => {
        const exists = prev.find(item => item._id === itemId);
        if (exists) return prev;
        return [...prev, itemToSave];
      });
      // Remove from cart
      removeFromCart(itemId);
      toast.info("Item saved for later!");
    }
  };

  // ✅ New function to move an item from saved to cart
  const moveToCart = (item) => {
    addToCart(item); // Use existing addToCart logic
    removeFromSaved(item._id); // Remove from saved list
  };

  // ✅ New function to remove an item from the saved list
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
