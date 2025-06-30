import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart } from "react-icons/fa";

const GoldPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        const goldItems = res.data.filter(
          (p) => p.category.toLowerCase() === "gold"
        );
        setProducts(goldItems);
      })
      .catch((err) => console.error("Failed to load gold products", err));
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gold Jewellery</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Wishlist Icon */}
              <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10">
                <FaHeart />
              </button>

              {/* Product Image - wrapped in a fixed-height div */}
              <div className="w-full h-40 bg-white">
                <img
                  src={`http://localhost:5000/uploads/${product.images?.[0]}`}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="p-3">
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
              <div className="absolute bottom-2 right-2 text-gray-500 hover:text-[#c29d5f] cursor-pointer">
                <FaShoppingCart />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default GoldPage;
