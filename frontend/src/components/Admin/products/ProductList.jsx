import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState([]);

 useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_BASE_URL}/api/products`)
    .then((res) => setProducts(res.data))
    .catch((err) => console.error("Failed to fetch products", err));
}, []);

const handleDelete = async (id) => {
  if (window.confirm("Delete this product?")) {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  }
};


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">All Products</h1>
      <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100 rounded-xl text-purple-900 text-left">
              <th className="px-6 py-3 font-semibold">Title</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">Price</th>
              <th className="px-6 py-3 font-semibold">Images</th>
              <th className="px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p._id} className="text-sm border-t text-gray-800 text-center">
                  <td className="px-6 py-4">{p.title}</td>
                  <td className="px-6 py-4">{p.category}</td>
                  <td className="px-6 py-4">₹{p.price}</td>
                  <td className="px-6 py-4">{p.images?.length || 0}</td>
                  <td className="px-6 py-4 space-x-2">
                    <Link
                      to={`/admin/products/edit/${p._id}`}
                      className="text-purple-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">
                  No products found.
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
