// src/components/Products/GoldProductList.jsx
import React, { useEffect } from "react";
import goldProducts from "./products";
import { useCart } from "../../context/CartContext";

const GoldProductList = () => {
  const { addToCart, cartItems } = useCart();

  const handleAddToCart = (product) => {
    console.log("🛒 Adding to cart:", product);
    addToCart(product);
  };

  useEffect(() => {
    console.log("🧾 Current cart items:", cartItems);
  }, [cartItems]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-yellow-800">
          ✨ Gold Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {goldProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl shadow-lg p-4 text-center bg-white hover:shadow-xl transition"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded mb-4"
              />
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-yellow-700 font-bold mt-1">
                ₹ {product.price.toLocaleString()}
              </p>
              <button
                onClick={() => handleAddToCart(product)}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white font-semibold rounded hover:bg-yellow-700 transition"
              >
                🛒 Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoldProductList;
