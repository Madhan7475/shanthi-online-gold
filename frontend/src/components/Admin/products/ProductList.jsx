import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ title: "", category: "", price: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProducts((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error("Failed to delete product", err);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(filters.title.toLowerCase()) &&
    product.category.toLowerCase().includes(filters.category.toLowerCase()) &&
    (!filters.price || product.price.toString().includes(filters.price))
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8] p-8 text-[#400F45]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 bg-[#e2d2e9] text-[#400F45] px-4 py-2 rounded-full hover:bg-[#d2b7de]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-bold">List of Items</h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="bg-[#400F45] text-white px-4 py-2 rounded-full hover:bg-[#330d37]"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {['title', 'category', 'price'].map((field) => (
          <div key={field}>
            <input
              type="text"
              name={field}
              value={filters[field]}
              onChange={handleFilterChange}
              placeholder={`Search ${field}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-[#400F45]"
            />
          </div>
        ))}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#400F45] text-white">
            <tr>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id} className="border-b hover:bg-[#f4eef8]">
                  <td className="p-4 flex items-center gap-4">
                    <img
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div>
                      <p className="font-semibold">{product.title}</p>
                      <span className="text-xs text-gray-500">ID: {product._id.slice(-6)}</span>
                    </div>
                  </td>
                  <td className="p-4">{product.category || "—"}</td>
                  <td className="p-4">₹{product.price}</td>
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
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No matching products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
