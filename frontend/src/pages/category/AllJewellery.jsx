import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import Pagination from "../../components/Common/Pagination";
import { FaHeart, FaShoppingCart, FaFilter } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";

const AllJewellery = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [addingMap, setAddingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToCart, saveForItemLater, cartItems } = useCart();
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth();

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/products`;
      const res = await axios.get(url, { params: { page, limit: 12 } });
      const data = res.data;
      const products = data.items || data;
      setAllProducts(Array.isArray(products) ? products : []);
      const pages = data.pages || data.totalPages || 1;
      setTotalPages(pages);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

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
    <Layout>
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img src="/gold14.jpg" alt="Jewellery Banner" className="w-full h-full object-cover" />
      </div>

      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-7xl mx-auto relative">
        <h1 className="text-2xl font-bold mb-4 mt-6 text-[#400F45] text-center">All Jewellery</h1>

        <div className="flex justify-start mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
            onClick={() => navigate(`/products?openFilters=1`)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
            {allProducts.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-500">No products found.</p>
              </div>
            ) : (
              allProducts.map((product) => (
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
                        product.primaryImageUrl
                          ? product.primaryImageUrl
                          : product.imageUrls?.[0]
                            ? product.imageUrls[0]
                            : product.images?.[0]
                              ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${product.images[0]}`
                              : "/placeholder.png"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm font-medium text-gray-800 truncate">{product.title}</h2>
                    <p className="text-sm text-gray-600 mb-1 truncate">{product.category}</p>
                    <p className="text-base font-semibold text-[#1a1a1a]">
                      ₹{product.price ? Number(product.price).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <button
                    className={`absolute bottom-2 right-2 ${isInCart(product) ? "text-green-600" : "text-gray-500 hover:text-[#c29d5f]"} ${addingMap[product._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addingMap[product._id] || isInCart(product)}
                    title={isInCart(product) ? "In Cart" : (addingMap[product._id] ? "Adding..." : "Add to Cart")}
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

export default AllJewellery;
