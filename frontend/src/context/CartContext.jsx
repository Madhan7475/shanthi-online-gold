import React, { createContext, useContext, useEffect, useState } from "react";
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
        toast.info("Item already in cart");
        return prev;
      }
      toast.success("Item added to cart!");
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // **Update Quantity**
  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
    toast.info("Quantity updated!");
  };

  // **Remove from Cart**
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item._id !== id));
    toast.info("Item removed from cart");
  };

  // **Clear Cart**
  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart cleared");
  };

  // **Save Item for Later**
  const saveForItemLater = (product) => {
    const isAlreadySaved = savedItems.some((item) => item._id === product._id);
    if (isAlreadySaved) {
      toast.info("Item is already in your saved list.");
      return;
    }
    setSavedItems((prev) => [...prev, product]);
    setCartItems((prev) => prev.filter((item) => item._id !== product._id));
    toast.success("Item saved for later!");
  };

  // **Move Saved to Cart**
  const moveToCart = (item) => {
    const existsInCart = cartItems.some((cartItem) => cartItem._id === item._id);
    if (existsInCart) {
      toast.info("This item is already in your cart.");
      return;
    }
    setCartItems((prev) => [...prev, { ...item, quantity: 1 }]);
    removeFromSaved(item._id);
    toast.success("Item moved to cart!");
  };

  // **Remove from Saved**
  const removeFromSaved = (itemId) => {
    setSavedItems((prev) => prev.filter((item) => item._id !== itemId));
    toast.info("Item removed from saved list");
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
