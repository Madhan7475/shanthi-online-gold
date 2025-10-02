import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useRequireAuth } from "../utils/useRequireAuth";
import Pagination from "../components/Common/Pagination";

const SearchPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingMap, setAddingMap] = useState({});
  const { addToCart, saveForItemLater, cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth();

  // Get search query from URL
  const query = new URLSearchParams(location.search).get("query") || "";

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/products?q=${encodeURIComponent(query)}`
        );
        // Handle both paginated and plain array responses
        const productsData = res.data.items || res.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("❌ Failed to search products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleProductClick = (id) => navigate(`/product/${id}`);
  const isInCart = (p) => cartItems?.some((ci) => String(ci.productId) === String(p._id));

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    if (isInCart(product)) return;

    setAddingMap((m) => ({ ...m, [product._id]: true }));
    await runWithAuth(async () => {
      try {
        await addToCart(product);
      } finally {
        setAddingMap((m) => {
          const { [product._id]: _, ...rest } = m;
          return rest;
        });
      }
    });
  };

  const handleSaveItem = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => saveForItemLater(product));
  };

  return (
    <div className="min-h-screen bg-[#fffdf6]">
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-7xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6 text-[#400F45]">
          Search Results for: <span className="text-gray-800">"{query}"</span>
        </h1>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Searching products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {query.trim() ? `No products found for "${query}".` : "Please enter a search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => handleProductClick(product._id)}
              >
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                  onClick={(e) => handleSaveItem(product, e)}
                >
                  <FaHeart />
                </button>
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
                <button
                  className={`absolute bottom-2 right-2 ${
                    isInCart(product)
                      ? "text-green-600"
                      : "text-gray-500 hover:text-[#c29d5f]"
                  } ${addingMap[product._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={addingMap[product._id] || isInCart(product)}
                  title={
                    isInCart(product)
                      ? "In Cart"
                      : addingMap[product._id]
                      ? "Adding..."
                      : "Add to Cart"
                  }
                >
                  <FaShoppingCart />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
