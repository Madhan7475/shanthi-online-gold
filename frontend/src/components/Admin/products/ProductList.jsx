// ProductList.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/products").then((res) => setProducts(res.data));
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Products</h1>
      <table className="w-full border table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Title</th>
            <th>Category</th>
            <th>Price</th>
            <th>Images</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="text-center border-t">
              <td>{p.title}</td>
              <td>{p.category}</td>
              <td>₹{p.price}</td>
              <td>{p.images?.length}</td>
              <td className="space-x-2">
                <Link to={`/admin/products/edit/${p._id}`} className="text-blue-600">Edit</Link>
                <button onClick={() => handleDelete(p._id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;
