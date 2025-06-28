import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const categories = [
  "All Jewellery", "Gold", "Diamond", "Silver", "Earrings", "Rings",
  "Daily Wear", "Baby Items", "Wedding", "Special Collection"
];

const ProductUpload = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    karatage: "",
    materialColour: "",
    grossWeight: "",
    metal: "",
    size: "",
    diamondClarity: "",
    diamondColor: "",
    numberOfDiamonds: "",
    diamondSetting: "",
    diamondShape: "",
    jewelleryType: "",
    brand: "",
    collection: "",
    gender: "",
    occasion: ""
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
      images.forEach((img) => data.append("images", img));

      await axios.post("http://localhost:5000/api/products", data);

      setMessage("✅ Product uploaded successfully!");
      setFormData({
        title: "", description: "", category: "", price: "",
        karatage: "", materialColour: "", grossWeight: "", metal: "", size: "",
        diamondClarity: "", diamondColor: "", numberOfDiamonds: "",
        diamondSetting: "", diamondShape: "", jewelleryType: "", brand: "",
        collection: "", gender: "", occasion: ""
      });
      setImages([]);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400";
  const labelClass = "block text-sm font-semibold text-purple-900 mb-1";

  return (
    <div className="bg-white border rounded-3xl p-8 max-w-6xl mx-auto mt-10 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-900">Upload New Product</h2>
        <div className="space-x-3">
          <Link to="/admin/products/list" className="text-sm bg-purple-100 px-4 py-2 rounded-full text-purple-900 hover:bg-purple-200">📋 Product List</Link>
          <Link to="/admin/products/edit/sample-id" className="text-sm bg-purple-100 px-4 py-2 rounded-full text-purple-900 hover:bg-purple-200">✏️ Edit Product</Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Product Name</label>
            <input type="text" className={inputClass} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required></textarea>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
              <option value="" disabled>Select category</option>
              {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Price (₹)</label>
            <input type="number" className={inputClass} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Upload Images</label>
            <input type="file" onChange={handleImageChange} multiple accept="image/*" className="text-sm" />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.map((img, idx) => <img key={idx} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 rounded object-cover border" />)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Metal Details */}
          <div>
            <label className={labelClass}>Karatage</label>
            <input className={inputClass} value={formData.karatage} onChange={(e) => setFormData({ ...formData, karatage: e.target.value })} />
            <label className={labelClass}>Material Colour</label>
            <input className={inputClass} value={formData.materialColour} onChange={(e) => setFormData({ ...formData, materialColour: e.target.value })} />
            <label className={labelClass}>Gross Weight</label>
            <input className={inputClass} value={formData.grossWeight} onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })} />
            <label className={labelClass}>Metal</label>
            <input className={inputClass} value={formData.metal} onChange={(e) => setFormData({ ...formData, metal: e.target.value })} />
            <label className={labelClass}>Size</label>
            <input className={inputClass} value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
          </div>
          {/* Diamond Details */}
          <div>
            <label className={labelClass}>Diamond Clarity</label>
            <input className={inputClass} value={formData.diamondClarity} onChange={(e) => setFormData({ ...formData, diamondClarity: e.target.value })} />
            <label className={labelClass}>Diamond Color</label>
            <input className={inputClass} value={formData.diamondColor} onChange={(e) => setFormData({ ...formData, diamondColor: e.target.value })} />
            <label className={labelClass}>No Of Diamonds</label>
            <input className={inputClass} value={formData.numberOfDiamonds} onChange={(e) => setFormData({ ...formData, numberOfDiamonds: e.target.value })} />
            <label className={labelClass}>Diamond Setting</label>
            <input className={inputClass} value={formData.diamondSetting} onChange={(e) => setFormData({ ...formData, diamondSetting: e.target.value })} />
            <label className={labelClass}>Diamond Shape</label>
            <input className={inputClass} value={formData.diamondShape} onChange={(e) => setFormData({ ...formData, diamondShape: e.target.value })} />
          </div>

          {/* General Details */}
          <div className="col-span-2">
            <label className={labelClass}>Jewellery Type</label>
            <input className={inputClass} value={formData.jewelleryType} onChange={(e) => setFormData({ ...formData, jewelleryType: e.target.value })} />
            <label className={labelClass}>Brand</label>
            <input className={inputClass} value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            <label className={labelClass}>Collection</label>
            <input className={inputClass} value={formData.collection} onChange={(e) => setFormData({ ...formData, collection: e.target.value })} />
            <label className={labelClass}>Gender</label>
            <input className={inputClass} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
            <label className={labelClass}>Occasion</label>
            <input className={inputClass} value={formData.occasion} onChange={(e) => setFormData({ ...formData, occasion: e.target.value })} />
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={loading} className="bg-purple-800 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition">
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </div>

        {message && (
          <div className="md:col-span-2 text-center text-sm font-medium mt-4">
            <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductUpload;
