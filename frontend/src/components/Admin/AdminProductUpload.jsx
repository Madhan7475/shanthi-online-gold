import React, { useState } from "react";

const AdminProductUpload = () => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🚧 Here, you'd send data to the backend using Axios or Fetch
    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("price", product.price);
    formData.append("category", product.category);
    formData.append("description", product.description);
    formData.append("image", product.image);

    console.log("Form Submitted:", product);

    // Reset after submission
    setProduct({ name: "", price: "", category: "", description: "", image: null });
    setPreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg p-8 mt-10 rounded-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">🛠️ Upload New Product</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={product.price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={product.category}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 w-40 h-40 object-cover rounded-md"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-[#6B21A8] text-white px-6 py-2 rounded-md hover:bg-[#581C87]"
        >
          Upload Product
        </button>
      </form>
    </div>
  );
};

export default AdminProductUpload;
