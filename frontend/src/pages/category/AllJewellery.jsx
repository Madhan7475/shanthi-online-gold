import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart } from "react-icons/fa";

const AllJewellery = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        const allJewellery = res.data.filter(
          (p) => p.category?.toLowerCase() === "all jewellery"
        );
        setProducts(allJewellery);
      })
      .catch((err) => console.error("Failed to load products", err));
  }, []);

  const handleAddToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const productExists = existingCart.find((item) => item._id === product._id);

    if (productExists) {
      alert("Item already in cart");
    } else {
      existingCart.push({ ...product, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(existingCart));
      alert("Item added to cart");
    }
  };

  return (
    <Layout>
      <div className="p-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">All Jewellery</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
          {products.map((product) => (
            <div
              key={product._id}
              className="w-72 relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Wishlist Icon */}
              <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10">
                <FaHeart />
              </button>

              {/* Product Image with increased height */}
              <div className="w-full h-72 bg-white">
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
              <div
                className="absolute bottom-2 right-2 text-gray-500 hover:text-[#c29d5f] cursor-pointer"
                onClick={() => handleAddToCart(product)}
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

export default AllJewellery;
