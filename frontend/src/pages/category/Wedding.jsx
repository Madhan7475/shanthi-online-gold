import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout";
import { FaHeart, FaShoppingCart, FaFilter, FaTimes } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../utils/useRequireAuth";

const FILTER_DATA = {
    Price: ["< 25,000", "25,000 - 50,000", "50,000 - 1,00,000", "1,00,000+"],
    "Jewellery Type": [
        "Diamond Jewellery", "Gold Jewellery", "Jewellery with Gemstones", "Plain Jewellery with Stones", "Platinum Jewellery"
    ],
    Product: [
        "Bangle", "Bracelet", "Chain", "Earrings", "Finger Ring", "Haram", "Jewellery Set", "Kada", "Maang Tikka",
        "Mangalsutra", "Mangalsutra Set", "Necklace", "Necklace Set", "Nose Pin", "Others", "Pendant",
        "Pendant and Earrings Set", "Pendant with Chain"
    ],
    Gender: ["Women"],
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
    Collection: ["Classic", "Contemporary", "Festive", "Modern Gold", "Solitaire", "Sparkling Avenues"],
    Community: ["North Indian", "South Indian", "Gujarati", "Tamil", "Punjabi"],
    Type: ["Studs", "Hoops", "Jhumka", "Drops", "Pendant"]
};

const WeddingPage = () => {
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

            // Add category filter for Wedding
            params.append('category', 'Wedding');

            // Convert selected filters to API params
            Object.entries(selectedFilters).forEach(([category, options]) => {
                if (options.length === 0) return;

                if (category === "Price") {
                    const priceRanges = options.map(opt => {
                        if (opt === "< 25,000") return { max: 25000 };
                        if (opt === "25,000 - 50,000") return { min: 25000, max: 50000 };
                        if (opt === "50,000 - 1,00,000") return { min: 50000, max: 100000 };
                        if (opt === "1,00,000+") return { min: 100000 };
                        return null;
                    }).filter(Boolean);

                    if (priceRanges.length > 0) {
                        const allMins = priceRanges.filter(r => r.min).map(r => r.min);
                        const allMaxs = priceRanges.filter(r => r.max).map(r => r.max);
                        if (allMins.length > 0) params.append('priceMin', Math.min(...allMins));
                        if (allMaxs.length > 0) params.append('priceMax', Math.max(...allMaxs));
                    }
                } else {
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
                }
            });

            const url = `${import.meta.env.VITE_API_BASE_URL}/api/products?${params.toString()}`;
            const res = await axios.get(url);

            const fetchedProducts = res.data.items || res.data;
            setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
        } catch (error) {
            console.error("❌ Failed to load Wedding Collection products:", error);
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
                    src="/gold9.jpg"
                    alt="Jewellery Banner"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="pt-[30px] px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
                    Wedding Collection
                </h1>

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

                {/* Overlay */}
                <div
                    className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity duration-300 ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    onClick={() => setShowFilters(false)}
                />

                {/* Sidebar */}
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

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Loading products...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-10">
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
                                        <h2 className="text-sm font-medium text-gray-800 truncate">
                                            {product.title}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-1 truncate">
                                            {product.category}
                                        </p>
                                        <p className="text-base font-semibold text-[#1a1a1a]">
                                            ₹{product.price ? product.price.toLocaleString() : 'N/A'}
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
            </div>
        </Layout>
    );
};

export default WeddingPage;
