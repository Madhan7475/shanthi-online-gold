// ProductEdit.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ProductEdit = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({ title: "", category: "", description: "", price: "" });

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`).then((res) => setFormData(res.data));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:5000/api/products/${id}`, formData);
    alert("Product updated!");
  };

  return (
    <form onSubmit={handleUpdate} className="max-w-xl p-4 space-y-4 bg-white rounded shadow">
      <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title" className="input" />
      <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description" className="input" />
      <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Category" className="input" />
      <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price" className="input" />
      <button type="submit" className="bg-gold text-white px-4 py-2 rounded">Update</button>
    </form>
  );
};

export default ProductEdit;
