import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart, FaFilter } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";
import Pagination from "../../components/Common/Pagination";


const GoldPage = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToCart, saveForItemLater } = useCart();
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth();



  const fetchProducts = React.useCallback(async () => {
    try {
      const params = { metal: "Gold", page, limit: 12 };
      const { data } = await axiosInstance.get("/products", { params });
      const productsData = data.items || data;
      setProducts(Array.isArray(productsData) ? productsData : []);
      const pages = data.pages || data.totalPages || 1;
      setTotalPages(pages);
    } catch (err) {
      console.error("❌ Failed to load gold products:", err);
      setProducts([]);
    }
  }, [page]);

  // Fetch whenever filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);



  const handleProductClick = (id) => navigate(`/product/${id}`);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => addToCart(product));
  };

  const handleSaveItem = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => saveForItemLater(product));
  };

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold15.jpg"
          alt="Gold Jewellery Banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="pt-[30px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Gold Jewellery
        </h1>

        <div className="flex justify-start mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
            onClick={() => navigate(`/products?metal=Gold&openFilters=1`)}
          >
            <FaFilter />
            <span>Filters</span>
            <span className="rotate-90">⌄</span>
          </button>
        </div>




        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
          {products.map((product) => (
            <div
              key={product._id}
              className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => handleProductClick(product._id)}
            >
              {/* Save Item */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                onClick={(e) => handleSaveItem(product, e)}
              >
                <FaHeart />
              </button>

              {/* Product Image */}
              <div className="w-full h-72 bg-white">
                <img
                  src={
                    product.primaryImageUrl
                      ? product.primaryImageUrl
                      : product.imageUrls?.[0]
                        ? product.imageUrls[0]
                        : product.images?.[0]
                          ? `/uploads/${product.images[0]}`
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

              {/* Add to Cart */}
              <button
                className="absolute bottom-2 right-2 text-gray-500 hover:text-[#c29d5f]"
                onClick={(e) => handleAddToCart(product, e)}
              >
                <FaShoppingCart />
              </button>
            </div>
          ))}
        </div>
        {!false && totalPages > 1 && (
          <div className="pb-12">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GoldPage;
