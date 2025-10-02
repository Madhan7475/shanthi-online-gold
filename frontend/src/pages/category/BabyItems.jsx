import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart, FaFilter, FaTimes } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";

const FILTER_DATA = {
  "Jewellery Type": [
    "Diamond Jewellery", "Gold Jewellery", "Jewellery with Gemstones", "Plain Jewellery with Stones", "Platinum Jewellery"
  ],
  Product: [
    "Bangle", "Bracelet", "Chain", "Earrings", "Finger Ring", "Haram", "Jewellery Set", "Kada", "Maang Tikka",
    "Mangalsutra", "Mangalsutra Set", "Necklace", "Necklace Set", "Nose Pin", "Others", "Pendant",
    "Pendant and Earrings Set", "Pendant with Chain"
  ],
  Gender: ["Kids", "Men", "Unisex", "Women"],
  Purity: ["14", "18", "22", "95"],
  Occasion: [
    "Bridal Wear", "Casual Wear", "Engagement", "Modern Wear", "Office Wear", "Traditional and Ethnic Wear"
  ],
  Metal: ["Gold", "Platinum", "Silver"],
  "Diamond Clarity": [
    "B,I1 I2", "FL", "I1", "I1 / I2", "I1 I2", "I1-I2", "I2", "Mixed", "SI", "SI, SI1", "SI1", "SI1,SI2",
    "SI1-SI2, VS, VS2", "SI1-SI2, VS1", "SI1-SI2, VS2", "SI2", "VS", "VS,VS1", "VS, VS1", "VS1", "VS2",
    "VVS", "VVS,VS", "VVS1", "VVS1,VVS2", "VVS2"
  ],
  Collection: [
    "22KT Range", "A Chain Story", "A Fine Finish", "Aaheli", "Aalo", "Aarambh", "Aarna", "Akshayam", "Alekhya",
    "Alphabet Pendants", "Amara", "Arpanam", "Aurum", "Aveer", "Bestsellers", "Birthstone", "Bring the Shine",
    "Celeste", "Chakra Pendants", "Chozha", "Christmas Collection", "Classic", "Classics", "Cocktail Turkish Mount",
    "Colour Charms", "Colour Me Joy", "Commitment Bands", "Contemporary", "Core 20", "Couple Rings", "Devyani",
    "Dharohar", "Diamond Treats", "Dibyani", "Disco", "Divyam", "Diwali 19", "Dor", "Dots and Dashes", "Drops of Radiance",
    "Ekatvam", "Elan", "Enchanted Trails", "Engagement", "Engagement Ring", "Engagement Rings", "Eternity Bangles",
    "Evil Eye", "Exclusive Online", "Festive", "Festive Collection", "Ganesh Products", "Gifting Range", "Glamdays",
    "Glow with Flow", "Go with the flow", "God Pendant", "Homecoming", "Hoops", "Hues for you", "Impressions of Nature",
    "Into Eternity", "Kakatiya", "Kalai", "Kiss of Spring", "KonkonKotha", "Kundan Polki", "Kundan Stories",
    "lilac allure", "Little Big Moments", "Live a Dream", "Lotus", "Lucky Charms", "Maithili", "Mamma Mia", "Mangalam",
    "Men's Rings", "Mia Festive", "Mia Icicles", "Mia Play", "Mia sutra", "Mia Sutra", "Mia Symphony", "Miatini",
    "Modern Gold", "Modern Polki", "Moods of the Earth", "Multifinish Finger Rings", "Native", "Nature's Finest",
    "Nav raani", "Nityam", "Nyusha", "Nyusha 2", "Nyusha1", "Once Upon a Moment", "Open Polki", "Padmaavat", "Padmaja",
    "Platinum Collections", "Platinum Kadas", "Preen", "Pretty in Pink", "Rainbow Rhythm", "Rajadhiraj", "Rare Pair Collection",
    "Red Dot Awards Collection", "Religious", "Rhythms of Rain", "Rivaah", "RivaahXTarun Tahiliani", "Sarang Hearts", "Shaaj",
    "Shagun", "Sleek", "Solitaire", "Solitaires", "Soulmate Diamond Pair", "Sparkling Avenues", "Srotika", "Starburst",
    "String it", "Stunning Every Ear", "Svarupam", "Swarnam", "Swayahm", "Switch and Shine", "Tales of Mystique",
    "The Cocktail Edit", "The Cupid Edit", "The Initial edit", "The Initial Edit", "The Italian Connection",
    "The Signature Edit", "The Spotlight Edit", "Trims", "Udayam", "Ugadi", "Unbound", "Utsaah", "Utsava", "Uttama",
    "Uttara", "Valentines", "Vinayaka Pendants", "Virasat", "Wear Your Prayer", "Wonderlust", "Zodiac Sign Pendants",
    "Zodiac Sign Ring", "Zuhur"
  ],
  Community: [
    "Bengali", "Bihari", "Classic must haves", "Contemporary", "Gujarati", "Indian Bridal", "Kannada", "Maharashtrian",
    "Marwari", "Metro", "North Indian", "Punjabi", "South Indian", "Tamil", "Telugu"
  ],
  Type: [
    "Choor", "Drops", "Gala Bala", "Hoops", "Jhumka", "Kankan", "Loha Bangle", "OTHERS", "Solid Bala", "Studs"
  ]
};

const BabyItemsPage = () => {
  const [products, setProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});
  const [addingMap, setAddingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const { addToCart, saveForItemLater, cartItems } = useCart();
  const navigate = useNavigate();
  const { runWithAuth } = useRequireAuth();

  useEffect(() => {
    fetchProducts();
  }, [selectedFilters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add category filter for baby items
      params.append('category', 'Baby Items');
      
      // Convert selected filters to API params
      Object.entries(selectedFilters).forEach(([category, options]) => {
        if (options.length === 0) return;

        // Map category names to backend field names
        const fieldMap = {
          "Jewellery Type": "jewelleryType",
          "Product": "product",
          "Gender": "gender",
          "Purity": "purity",
          "Occasion": "occasion",
          "Metal": "metal",
          "Diamond Clarity": "diamondClarity",
          "Collection": "collection",
          "Community": "community",
          "Type": "type"
        };
        
        const fieldName = fieldMap[category];
        if (fieldName && options.length > 0) {
          params.append(fieldName, options.join(','));
        }
      });

      const url = `${import.meta.env.VITE_API_BASE_URL}/api/products?${params.toString()}`;
      const res = await axios.get(url);
      
      const products = res.data.items || res.data;
      setProducts(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error("❌ Failed to load Baby Items:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (category, option) => {
    setSelectedFilters(prev => {
      const currentCategoryFilters = prev[category] || [];
      const newCategoryFilters = currentCategoryFilters.includes(option)
        ? currentCategoryFilters.filter(item => item !== option)
        : [...currentCategoryFilters, option];

      if (newCategoryFilters.length === 0) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [category]: newCategoryFilters };
    });
  };

  const toggleFilter = (key) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProductClick = (id) => navigate(`/product/${id}`);
  const isInCart = (p) => cartItems?.some((ci) => String(ci.productId) === String(p._id));

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    if (isInCart(product)) return;

    setAddingMap((m) => ({ ...m, [product._id]: true }));
    await runWithAuth(async () => {
      try {
        await addToCart(product);
      } finally {
        setAddingMap((m) => {
          const { [product._id]: _, ...rest } = m;
          return rest;
        });
      }
    });
  };

  const handleSaveItem = (product, e) => {
    e.stopPropagation();
    runWithAuth(() => saveForItemLater(product));
  };

  return (
    <Layout>
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold11.jpg"
          alt="Jewellery Banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="pt-[30px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">Baby Items</h1>
        <div className="flex justify-start mb-6">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-[#400F45] hover:bg-gray-100"
            onClick={() => setShowFilters(true)}
          >
            <FaFilter />
            <span>Filter ({Object.values(selectedFilters).flat().length})</span>
            <span className="rotate-90">⌄</span>
          </button>
        </div>

        <div
          className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity duration-300 ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setShowFilters(false)}
        />

        <div
          className={`fixed top-0 left-0 w-80 h-full bg-white z-40 p-6 shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out ${showFilters ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#400F45]">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-[#400F45]">
              <FaTimes size={18} />
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(FILTER_DATA).map(([label, options]) => (
              <div key={label}>
                <button
                  onClick={() => toggleFilter(label)}
                  className="w-full text-left font-medium text-sm text-[#400F45] border-b py-2"
                >
                  {label}
                </button>
                <div
                  className={`mt-2 transition-all duration-300 ease-in-out ${expandedFilters[label] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                >
                  <ul className="pl-2 pr-1 py-1 space-y-1 text-sm text-[#333] max-h-[300px] overflow-y-auto">
                    {options.map((opt, idx) => (
                      <li key={idx} className="truncate">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={(selectedFilters[label] || []).includes(opt)}
                            onChange={() => handleFilterChange(label, opt)}
                          />
                          {opt}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-500">No products found matching your filters.</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => handleProductClick(product._id)}
                >
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                    onClick={(e) => handleSaveItem(product, e)}
                  >
                    <FaHeart />
                  </button>
                  <div className="w-full h-72 bg-white">
                    <img
                      src={
                        product.images?.[0]
                          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${product.images[0]}`
                          : "/placeholder.png"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm font-medium text-gray-800 truncate">{product.title}</h2>
                    <p className="text-sm text-gray-600 mb-1 truncate">{product.category}</p>
                    <p className="text-base font-semibold text-[#1a1a1a]">
                      ₹{product.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    className={`absolute bottom-2 right-2 ${isInCart(product) ? "text-green-600" : "text-gray-500 hover:text-[#c29d5f]"} ${addingMap[product._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={addingMap[product._id] || isInCart(product)}
                    title={isInCart(product) ? "In Cart" : (addingMap[product._id] ? "Adding..." : "Add to Cart")}
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </Layout>
  );
};

export default BabyItemsPage;
