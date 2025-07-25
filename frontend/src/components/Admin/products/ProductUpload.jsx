import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart3, Package, ShoppingCart, Users, FileText,
  LogOut
} from "lucide-react";

const CATEGORIES = ["All Jewellery", "Gold", "Diamond", "Silver", "Earrings", "Rings", "Daily Wear", "Baby Items", "Wedding", "Special Collection"];
const COLLECTIONS = ["22KT Range", "A Chain Story", "A Fine Finish", "Aaheli", "Aalo", "Aarambh", "Aarna", "Akshayam", "Alekhya", "Alphabet Pendants", "Amara", "Arpanam", "Aurum", "Aveer", "Bestsellers", "Birthstone", "Bring the Shine", "Celeste", "Chakra Pendants", "Chozha", "Christmas Collection", "Classic", "Classics", "Cocktail Turkish Mount", "Colour Charms", "Colour Me Joy", "Commitment Bands", "Contemporary", "Core 20", "Couple Rings", "Devyani", "Dharohar", "Diamond Treats", "Dibyani", "Disco", "Divyam", "Diwali 19", "Dor", "Dots and Dashes", "Drops of Radiance", "Ekatvam", "Elan", "Enchanted Trails", "Engagement", "Engagement Ring", "Engagement Rings", "Eternity Bangles", "Evil Eye", "Exclusive Online", "Festive", "Festive Collection", "Ganesh Products", "Gifting Range", "Glamdays", "Glow with Flow", "Go with the flow", "God Pendant", "Homecoming", "Hoops", "Hues for you", "Impressions of Nature", "Into Eternity", "Kakatiya", "Kalai", "Kiss of Spring", "KonkonKotha", "Kundan Polki", "Kundan Stories", "lilac allure", "Little Big Moments", "Live a Dream", "Lotus", "Lucky Charms", "Maithili", "Mamma Mia", "Mangalam", "Men's Rings", "Mia Festive", "Mia Icicles", "Mia Play", "Mia sutra", "Mia Sutra", "Mia Symphony", "Miatini", "Modern Gold", "Modern Polki", "Moods of the Earth", "Multifinish Finger Rings", "Native", "Nature's Finest", "Nav raani", "Nityam", "Nyusha", "Nyusha 2", "Nyusha1", "Once Upon a Moment", "Open Polki", "Padmaavat", "Padmaja", "Platinum Collections", "Platinum Kadas", "Preen", "Pretty in Pink", "Rainbow Rhythm", "Rajadhiraj", "Rare Pair Collection", "Red Dot Awards Collection", "Religious", "Rhythms of Rain", "Rivaah", "RivaahXTarun Tahiliani", "Sarang Hearts", "Shaaj", "Shagun", "Sleek", "Solitaire", "Solitaires", "Soulmate Diamond Pair", "Sparkling Avenues", "Srotika", "Starburst", "String it", "Stunning Every Ear", "Svarupam", "Swarnam", "Swayahm", "Switch and Shine", "Tales of Mystique", "The Cocktail Edit", "The Cupid Edit", "The Initial edit", "The Initial Edit", "The Italian Connection", "The Signature Edit", "The Spotlight Edit", "Trims", "Udayam", "Ugadi", "Unbound", "Utsaah", "Utsava", "Uttama", "Uttara", "Valentines", "Vinayaka Pendants", "Virasat", "Wear Your Prayer", "Wonderlust", "Zodiac Sign Pendants", "Zodiac Sign Ring", "Zuhur"];
const OPTIONS_MAP = {
  karatage: ["14", "18", "22", "95"],
  materialColour: ["Rose", "White", "White and Rose", "Yellow", "Yellow and Rose", "Yellow and White", "Yellow White and Rose"],
  metal: ["Gold", "Platinum", "Silver"],
  diamondClarity: ["B,I1 I2", "FL", "I1", "I1 / I2", "I1 I2", "I1-I2", "I2", "Mixed", "SI", "SI, SI1", "SI1", "SI1,SI2", "SI1-SI2, VS, VS2", "SI1-SI2, VS1", "SI1-SI2, VS2", "SI2", "VS", "VS,VS1", "VS, VS1", "VS1", "VS2", "VVS", "VVS,VS", "VVS1", "VVS1,VVS2", "VVS2"],
  jewelleryType: ["Diamond Jewellery", "Gold Jewellery", "Jewellery with Gemstones", "Plain Jewellery with Stones", "Platinum Jewellery"],
  brand: ["SOG"],
  gender: ["Kids", "Men", "Unisex", "Women"],
  occasion: ["Bridal Wear", "Casual Wear", "Engagement", "Modern Wear", "Office Wear", "Traditional and Ethnic Wear"],
  collection: COLLECTIONS
};

const NavItem = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center space-x-3 text-[#ffffff] hover:text-[#f599ff] transition-all">
    {icon}<span>{label}</span>
  </Link>
);

const ProductUpload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", description: "", category: "", price: "", stocks: "",
    karatage: "", materialColour: "", grossWeight: "", metal: "", size: "",
    diamondClarity: "", diamondColor: "", numberOfDiamonds: "",
    diamondSetting: "", diamondShape: "", jewelleryType: "", brand: "",
    collection: "", gender: "", occasion: ""
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => setImages([...e.target.files]);
  const handleChange = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      images.forEach((img) => data.append("images", img));

      await axios.post(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:9000"}/api/products`, data);
      setMessage("✅ Product uploaded successfully!");
      setFormData({ title: "", description: "", category: "", price: "", stocks: "", karatage: "", materialColour: "", grossWeight: "", metal: "", size: "", diamondClarity: "", diamondColor: "", numberOfDiamonds: "", diamondSetting: "", diamondShape: "", jewelleryType: "", brand: "", collection: "", gender: "", occasion: "" });
      setImages([]);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-xl bg-[#f8f8f8] border border-[#d1bfd9] text-sm focus:outline-none focus:ring-2 focus:ring-[#400F45]";
  const labelClass = "block text-sm font-semibold text-[#400F45] mb-1";

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      <aside className="w-64 bg-[#400F45] border-r-4 border-[#fff2a6] p-6 hidden md:block shadow-xl rounded-tr-2xl rounded-br-2xl">
        <h1 className="text-2xl font-bold mb-8 flex items-center justify-center">
          <img src="/logo.svg" alt="Logo" className="h-12 w-auto object-contain inline-block" />
        </h1>
        <nav className="space-y-10 text-gray-200">
          <NavItem to="/admin/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/admin/products" icon={<Package size={18} />} label="Products" />
          <NavItem to="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
          <NavItem to="/admin/profiles" icon={<Users size={18} />} label="Profiles" />
          <NavItem to="/admin/invoices" icon={<FileText size={18} />} label="Invoices" />
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#400F45]">Upload Product</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/admin/products/list")} className="bg-[#e2d2e9] text-[#400F45] px-4 py-2 rounded-md hover:bg-[#d2b7de] transition text-sm">Product List</button>
            <button onClick={() => { localStorage.removeItem("adminToken"); navigate("/admin/login"); }} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#d1bfd9] rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Product Name</label>
                <input type="text" className={inputClass} value={formData.title} onChange={(e) => handleChange("title", e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none`} rows="3" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select className={inputClass} value={formData.category} onChange={(e) => handleChange("category", e.target.value)} required>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input type="number" className={inputClass} value={formData.price} onChange={(e) => handleChange("price", e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Upload Images</label>
                <label htmlFor="imageUpload" className="inline-block cursor-pointer bg-[#400F45] text-white px-6 py-2 rounded-full hover:bg-[#330d37] transition text-sm">Choose Images</label>
                <input id="imageUpload" type="file" onChange={handleImageChange} multiple accept="image/*" className="hidden" />
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <img key={idx} src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 rounded-lg object-cover border border-[#d1bfd9]" />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(formData).filter(key => key !== 'title' && key !== 'description' && key !== 'category' && key !== 'price').map((key) => (
                <div key={key}>
                  <label className={labelClass}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  {OPTIONS_MAP[key] ? (
                    <select className={inputClass} value={formData[key]} onChange={(e) => handleChange(key, e.target.value)}>
                      <option value="">Select {key}</option>
                      {OPTIONS_MAP[key].map((option, i) => <option key={i} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input className={inputClass} value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            <div className="md:col-span-2 flex justify-end mt-6">
              <button type="submit" disabled={loading} className="bg-[#400F45] text-white px-6 py-2 rounded-full hover:bg-[#330d37] transition">
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
      </main>
    </div>
  );
};

export default ProductUpload;
