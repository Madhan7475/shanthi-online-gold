import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart, FaFilter } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";


const SilverPage = () => {
  const [products, setProducts] = useState([]);
  const { addToCart, saveForItemLater } = useCart(); // ✅ Get saveForItemLater
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth(); // ✅ Get the auth wrapper

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=silver`);
        // Handle both paginated and plain array responses
        const productsData = res.data.items || res.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("❌ Failed to load silver products:", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);


  const handleProductClick = (id) => navigate(`/product/${id}`);

  // ✅ CORRECTED HANDLER
  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => {
      addToCart(product);
    });
  };

  // ✅ CORRECTED HANDLER
  const handleSaveItem = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => {
      saveForItemLater(product);
    });
  };

  return (
    <Layout>
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/silver.jpg"
          alt="Jewellery Banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="pt-[30px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Silver Jewellery
        </h1>

        <div className="flex justify-start mb-6">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
            onClick={() => navigate(`/products?metal=Silver&openFilters=1`)}
          >
            <FaFilter />
            <span>Filter</span>
            <span className="rotate-90">⌄</span>
          </button>
        </div>



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
                  ₹{product.price ? product.price.toLocaleString() : 'N/A'}
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
      </div>
    </Layout>
  );
};

export default SilverPage;
