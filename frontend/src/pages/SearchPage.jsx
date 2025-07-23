// src/pages/SearchPage.jsx
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Dummy Product Data (Replace with your actual API or product list)
const PRODUCTS = [
  { id: 1, name: "Gold Necklace", price: 12000, image: "/images/gold-necklace.jpg" },
  { id: 2, name: "Diamond Ring", price: 25000, image: "/images/diamond-ring.jpg" },
  { id: 3, name: "Silver Bracelet", price: 5000, image: "/images/silver-bracelet.jpg" },
  { id: 4, name: "Gold Bangles", price: 15000, image: "/images/gold-bangles.jpg" },
];

const SearchPage = () => {
  const { addToCart } = useCart();
  const location = useLocation();

  // Get search query from URL
  const query = useMemo(() => new URLSearchParams(location.search).get("query") || "", [location]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    return PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-[#400F45]">
        Search Results for: <span className="text-black">"{query}"</span>
      </h2>

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500 text-lg">No products found for "{query}".</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <p className="text-[#400F45] font-bold mt-1">₹{product.price.toLocaleString()}</p>
              <button
                onClick={() => addToCart(product)}
                className="mt-3 w-full bg-[#400F45] text-white py-2 rounded hover:bg-[#2e0a31] transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
