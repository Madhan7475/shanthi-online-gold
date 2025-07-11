import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

const WeddingPage = () => {
  const [products, setProducts] = useState([]);
  const { cartItems, addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL/api/products}`);
        const filtered = res.data.filter(
          (p) => p.category?.toLowerCase() === "wedding"
        );
        setProducts(filtered);
      } catch (err) {
        console.error("❌ Failed to load Wedding Collection products:", err);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();

    if (!localStorage.getItem("userToken")) {
      alert("Please sign in to add items to your cart.");
      return navigate("/signin");
    }

    const exists = cartItems.find((item) => item._id === product._id);
    if (exists) {
      alert("Item already in cart");
    } else {
      addToCart(product);
      alert("Item added to cart");
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Wedding Collection
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product._id}
              className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => handleProductClick(product._id)}
            >
              {/* Wishlist Icon */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <FaHeart />
              </button>

              {/* Product Image */}
              <div className="w-full h-72 bg-white">
                <img
                  src={
                    product.images?.[0]
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${product.images[0]}`
                      : "/placeholder.png"
                  }
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h2 className="text-sm font-medium text-gray-800 truncate">
                  {product.title}
                </h2>
                <p className="text-sm text-gray-600 mb-1 truncate">
                  {product.category}
                </p>
                <p className="text-base font-semibold text-[#1a1a1a]">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>

              {/* Cart Icon */}
              <div
                className="absolute bottom-2 right-2 text-gray-500 hover:text-[#c29d5f] cursor-pointer"
                onClick={(e) => handleAddToCart(product, e)}
              >
                <FaShoppingCart />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default WeddingPage;
