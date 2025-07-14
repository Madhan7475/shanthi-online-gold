import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const categories = [
  "All Jewellery", "Gold", "Diamond", "Silver", "Earrings", "Rings",
  "Daily Wear", "Baby Items", "Wedding", "Special Collection"
];

const optionsMap = {
  karatage: ["14", "18", "22", "95"],
  materialColour: [
    "Rose", "White", "White and Rose", "Yellow",
    "Yellow and Rose", "Yellow and White", "Yellow White and Rose"
  ],
  metal: ["Gold", "Platinum", "Silver"],
  diamondClarity: [
    "B,I1 I2", "FL", "I1", "I1 / I2", "I1 I2", "I1-I2", "I2", "Mixed", "SI",
    "SI, SI1", "SI1", "SI1,SI2", "SI1-SI2, VS, VS2", "SI1-SI2, VS1",
    "SI1-SI2, VS2", "SI2", "VS", "VS,VS1", "VS, VS1", "VS1", "VS2",
    "VVS", "VVS,VS", "VVS1", "VVS1,VVS2", "VVS2"
  ],
  jewelleryType: [
    "Diamond Jewellery", "Gold Jewellery", "Jewellery with Gemstones",
    "Plain Jewellery with Stones", "Platinum Jewellery"
  ],
  brand: ["SOG"],
  gender: ["Kids", "Men", "Unisex", "Women"],
  occasion: [
    "Bridal Wear", "Casual Wear", "Engagement",
    "Modern Wear", "Office Wear", "Traditional and Ethnic Wear"
  ]
};

const initialFormData = {
  title: "", description: "", category: "", price: "",
  karatage: "", materialColour: "", grossWeight: "", metal: "", size: "",
  diamondClarity: "", diamondColor: "", numberOfDiamonds: "",
  diamondSetting: "", diamondShape: "", jewelleryType: "", brand: "",
  collection: "", gender: "", occasion: "",
  stock: ""
};

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setFormData({ ...initialFormData, ...data });
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val ?? ""));
      images.forEach((file) => data.append("images", file));

      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`, data);

      if (res.status === 200 || res.status === 201) {
        setMessage("✅ Product updated successfully!");
        setTimeout(() => navigate("/admin/products/list"), 1000);
      } else {
        throw new Error("Unexpected response status: " + res.status);
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Failed to update product. Check ID or server logs.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9] text-sm focus:outline-none focus:ring-2 focus:ring-[#400F45]";
  const labelClass = "block text-sm font-semibold text-[#400F45] mb-1";

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-white rounded-2xl border border-[#d1bfd9] shadow-md">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="bg-[#f3e8f7] text-[#400F45] px-4 py-2 rounded-full hover:bg-[#e2cbee] text-sm"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-[#400F45]">Edit Product</h2>
        <div></div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Product Name</label>
            <input name="title" value={formData.title} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className={`${inputClass} resize-none`} required />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className={inputClass} required>
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Price (₹)</label>
            <input name="price" type="number" value={formData.price} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Upload New Images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} className="text-sm mt-1" />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <img key={i} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded border border-[#d1bfd9]" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.keys(initialFormData).filter((key) => !["title", "description", "category", "price"].includes(key)).map((key) => (
            <div key={key}>
              <label className={labelClass}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</label>
              {optionsMap[key] ? (
                <select name={key} value={formData[key]} onChange={handleChange} className={inputClass}>
                  <option value="">Select {key}</option>
                  {optionsMap[key].map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input name={key} value={formData[key]} onChange={handleChange} className={inputClass} />
              )}
            </div>
          ))}
        </div>

        <div className="col-span-full flex justify-end mt-6">
          <button type="submit" disabled={loading} className="bg-[#400F45] text-white px-6 py-2 rounded-full hover:bg-[#330d37] transition">
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
        {message && (
          <div className="col-span-full text-center text-sm font-medium mt-4">
            <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductEdit;
