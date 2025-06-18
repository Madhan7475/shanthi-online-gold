import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import goldProducts from "./products";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import { Heart, ShoppingCart } from "lucide-react";

const GoldProductList = () => {
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth(); // 👈 get auth user
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    if (!user) {
      alert("❌ Please sign in to add products to your cart.");
      navigate("/signin"); // redirect to signin if not logged in
      return;
    }
    addToCart(product);
  };

  useEffect(() => {
    console.log("🧾 Current cart items:", cartItems);
  }, [cartItems]);

  return (
    <div className="bg-white py-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Exclusive jewellery for you
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {goldProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl p-4 bg-white relative group hover:shadow-lg transition"
            >
              <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <Heart size={18} />
              </button>

              <Link to={`/product/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-contain mb-4 transform group-hover:scale-105 transition-transform duration-200"
                />
              </Link>

              <h3 className="text-base font-medium text-gray-800">
                {product.name}
              </h3>

              <p className="text-black font-semibold mt-1">
                ₹{product.price.toLocaleString()}
              </p>

              <button
                onClick={() => handleAddToCart(product)}
                className="absolute bottom-2 right-2 text-gray-500 hover:text-yellow-600"
                title="Add to Cart"
              >
                <ShoppingCart size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoldProductList;
