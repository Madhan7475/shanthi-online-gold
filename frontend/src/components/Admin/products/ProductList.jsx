import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI } from "../../../utils/api";
import AdminLayout from "../../AdminLayout";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ title: "", category: "", price: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getProducts();
      setProducts(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch products", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await adminAPI.deleteProduct(id);
      setProducts((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product. Please check the server.");
    }
  };

  // Filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const filteredProducts = products.filter(
    (product) =>
      product.title?.toLowerCase().includes(filters.title.toLowerCase()) &&
      product.category?.toLowerCase().includes(filters.category.toLowerCase()) &&
      (!filters.price || product.price?.toString().includes(filters.price))
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-[#400F45]">Product List</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="bg-[#400F45] text-white px-4 py-2 rounded-full hover:bg-[#330d37] transition text-sm"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#d1bfd9] rounded-2xl p-6 shadow-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {["title", "category", "price"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            value={filters[field]}
            onChange={handleFilterChange}
            placeholder={`Search ${field}`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-[#400F45]"
          />
        ))}
      </div>

      {/* Loading & error states */}
      {loading && (
        <p className="text-center text-gray-500 py-6">Loading products...</p>
      )}
      {error && <p className="text-center text-red-600 py-4">{error}</p>}

      {/* Product Table */}
      {!loading && !error && (
        <div className="bg-white border border-[#d1bfd9] rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#400F45] text-white">
              <tr>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-[#f4eef8]">
                    <td className="p-4 flex items-center gap-4">
                      <img
                        src={
                          product.primaryImageUrl ||
                          (product.imageUrls && product.imageUrls[0]) ||
                          (product.images && `${import.meta.env.VITE_API_BASE_URL || "http://localhost:9000"}/uploads/${product.images[0]}`) ||
                          "/placeholder.png"
                        }
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded-md border"
                      />
                      <div>
                        <p className="font-semibold">{product.title}</p>
                        <span className="text-xs text-gray-500">
                          ID: {product._id?.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{product.category || "—"}</td>
                    <td className="p-4">₹{product.price}</td>
                    <td className="p-4">{product.stocks || 0}</td>
                    <td className="p-4 text-center">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="text-[#400F45] font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="ml-4 text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">
                    No matching products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductList;
