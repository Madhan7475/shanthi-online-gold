import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const categories = [
  "All Jewellery", "Gold", "Diamond", "Silver", "Earrings", "Rings",
  "Daily Wear", "Baby Items", "Wedding", "Special Collection"
];

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    noOfDiamonds: "",
    diamondSetting: "",
    diamondShape: "",
    jewelleryType: "",
    brand: "",
    collection: "",
    gender: "",
    occasion: "",
  });
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then((res) => {
        setFormData(res.data);
      })
      .catch((err) => console.error("Error fetching product:", err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      images.forEach((img) => data.append("images", img));

      await axios.put(`http://localhost:5000/api/products/${id}`, data);
      setMessage("✅ Product updated successfully!");
      setTimeout(() => navigate("/admin/products/list"), 1500);
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-md border">
      <h2 className="text-2xl font-semibold text-purple-900 mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Section */}
        <div className="space-y-4">
          <input name="title" placeholder="Product Name" value={formData.title} onChange={handleChange} required className="w-full border rounded p-2" />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} rows="4" required className="w-full border rounded p-2" />
          <select name="category" value={formData.category} onChange={handleChange} required className="w-full border rounded p-2">
            <option value="">Select Category</option>
            {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
          </select>
          <input name="price" placeholder="Price" type="number" value={formData.price} onChange={handleChange} required className="w-full border rounded p-2" />
          <input type="file" onChange={(e) => setImages([...e.target.files])} multiple accept="image/*" className="w-full text-sm text-gray-600" />
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <img key={idx} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded border" />
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* METAL DETAILS */}
          <input name="karatage" placeholder="Karatage" value={formData.karatage} onChange={handleChange} className="border rounded p-2" />
          <input name="diamondClarity" placeholder="Diamond Clarity" value={formData.diamondClarity} onChange={handleChange} className="border rounded p-2" />
          <input name="materialColour" placeholder="Material Colour" value={formData.materialColour} onChange={handleChange} className="border rounded p-2" />
          <input name="diamondColor" placeholder="Diamond Color" value={formData.diamondColor} onChange={handleChange} className="border rounded p-2" />
          <input name="grossWeight" placeholder="Gross Weight" value={formData.grossWeight} onChange={handleChange} className="border rounded p-2" />
          <input name="noOfDiamonds" placeholder="No Of Diamonds" value={formData.noOfDiamonds} onChange={handleChange} className="border rounded p-2" />
          <input name="metal" placeholder="Metal" value={formData.metal} onChange={handleChange} className="border rounded p-2" />
          <input name="diamondSetting" placeholder="Diamond Setting" value={formData.diamondSetting} onChange={handleChange} className="border rounded p-2" />
          <input name="size" placeholder="Size" value={formData.size} onChange={handleChange} className="border rounded p-2" />
          <input name="diamondShape" placeholder="Diamond Shape" value={formData.diamondShape} onChange={handleChange} className="border rounded p-2" />

          {/* GENERAL DETAILS */}
          <input name="jewelleryType" placeholder="Jewellery Type" value={formData.jewelleryType} onChange={handleChange} className="border rounded p-2" />
          <input name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} className="border rounded p-2" />
          <input name="collection" placeholder="Collection" value={formData.collection} onChange={handleChange} className="border rounded p-2" />
          <input name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} className="border rounded p-2" />
          <input name="occasion" placeholder="Occasion" value={formData.occasion} onChange={handleChange} className="border rounded p-2" />
        </div>

        {/* Submit */}
        <div className="col-span-full flex justify-end">
          <button type="submit" disabled={loading} className="bg-purple-800 text-white px-6 py-2 rounded hover:bg-purple-700">
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
        {message && (
          <div className="col-span-full text-center text-sm font-medium">
            <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductEdit;
