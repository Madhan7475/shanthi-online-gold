import { useState } from "react";
import axios from "axios";

const categories = [
  "All Jewellery", "Gold", "Diamond", "Silver", "Earrings", "Rings", "Daily Wear", "Baby Items", "Wedding", "Special Collection"
];

const ProductUpload = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      images.forEach((img) => data.append("images", img)); // use "images" array for multiple files

      await axios.post("http://localhost:5000/api/products", data);

      setMessage("✅ Product uploaded successfully!");
      setFormData({ title: "", description: "", category: "", price: "" });
      setImages([]);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 mt-10 border border-gray-200">
      <h2 className="text-2xl font-semibold text-[#C19A5B] mb-6">Upload New Product</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Product title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows="4"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Product description"
          ></textarea>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="" disabled>Select a category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter price"
          />
        </div>

        {/* Multiple Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Images</label>
          <input
            type="file"
            onChange={handleImageChange}
            multiple
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-600"
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.length > 0 &&
              images.map((img, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(img)}
                  alt={`preview-${index}`}
                  className="w-20 h-20 object-cover border rounded"
                />
              ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C19A5B] text-white px-5 py-2 rounded hover:bg-[#b08b4e] transition"
          >
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="text-center mt-4 text-sm font-medium">
            {message.includes("✅") ? (
              <span className="text-green-600">{message}</span>
            ) : (
              <span className="text-red-600">{message}</span>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductUpload;
