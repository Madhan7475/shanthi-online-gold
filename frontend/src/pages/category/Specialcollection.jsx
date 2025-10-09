import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import Layout from "../../components/Common/Layout";
import Pagination from "../../components/Common/Pagination";
import { FaHeart, FaShoppingCart, FaFilter } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";


const SpecialCollectionPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToCart, saveForItemLater } = useCart();
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth();

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/products", {
        params: { category: "Special Collection", page, limit: 12 },
      });
      const items = data.items || data;
      setProducts(Array.isArray(items) ? items : []);
      const pages = data.pages || data.totalPages || 1;
      setTotalPages(pages);
    } catch (err) {
      console.error("❌ Failed to load Special Collection products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };


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
          src="/gold9.jpg"
          alt="Jewellery Banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="pt-[30px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Special Collection
        </h1>

        <div className="flex justify-start mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
            onClick={() => navigate(`/products?category=Special%20Collection&openFilters=1`)}
          >
            <FaFilter />
            <span>Filters</span>
            <span className="rotate-90">⌄</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-500">No products found in Special Collection.</p>
              </div>
            ) : (
              products.map((product) => (
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
              ))
            )}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="pb-12">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SpecialCollectionPage;
