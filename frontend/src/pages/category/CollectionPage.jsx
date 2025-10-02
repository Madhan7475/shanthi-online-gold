import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaShoppingCart, FaHeart } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useRequireAuth } from "../../utils/useRequireAuth";

const CollectionPage = () => {
  const { slug } = useParams(); // 👈 get slug from route
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, saveForItemLater } = useCart();
  const { runWithAuth } = useRequireAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        params.append('category', slug);

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/products?${params.toString()}`
        );

        const fetchedProducts = res.data.items || res.data;
        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  const handleProductClick = (id) => navigate(`/product/${id}`);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => addToCart(product));
  };

  const handleSaveItem = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => saveForItemLater(product));
  };

  return (
    <Layout>
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-[#400F45] mt-6 mb-8">
          {slug.replace("-", " ").toUpperCase()}
        </h1>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600">
            No products found for this collection.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
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
                  className="absolute bottom-2 right-2 text-gray-500 hover:text-[#c29d5f]"
                  onClick={(e) => handleAddToCart(product, e)}
                >
                  <FaShoppingCart />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CollectionPage;
