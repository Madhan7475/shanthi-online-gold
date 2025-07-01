import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Common/Layout";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProduct(res.data);
        setSelectedImage(res.data.images?.[0] || null);
      } catch (err) {
        console.error("❌ Error loading product:", err);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!localStorage.getItem("userToken")) {
      alert("Please sign in to add items to your cart.");
      return navigate("/signin");
    }
    const exists = cartItems.find((item) => item._id === product._id);
    if (exists) {
      alert("Item already in cart");
    } else {
      addToCart(product);
      alert("Item added to cart");
    }
  };

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-sm text-gray-600 mb-4">
          Home &gt; Product &gt;{" "}
          <span className="text-[#4b1e59] font-semibold">{product.title}</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">{product.title}</h1>
        <p className="text-center text-2xl text-[#4b1e59] font-bold mb-6">
          ₹{product.price?.toLocaleString()}
          <br />
          <span className="text-sm font-normal text-gray-500">
            Incl. taxes and charges
          </span>
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="flex flex-col items-center">
            <div className="w-full border rounded-lg mb-4 overflow-hidden bg-white">
              {selectedImage ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${selectedImage}`}
                  alt={product.title}
                  className="w-full h-[300px] object-contain"
                />
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex space-x-4">
              {product.images?.map((img, idx) => (
                <img
                  key={idx}
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${img}`}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 object-cover border rounded-md cursor-pointer ${
                    selectedImage === img
                      ? "border-[#c29d5f]"
                      : "border-gray-300"
                  }`}
                  alt={`View ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div>
            {/* Tabs */}
            <div className="flex mb-6 border-b border-gray-300">
              <button
                onClick={() => setTab("details")}
                className={`px-4 py-2 font-medium border-b-4 ${
                  tab === "details"
                    ? "border-[#4b1e59] text-[#4b1e59]"
                    : "border-transparent text-gray-500"
                }`}
              >
                Product Details
              </button>
              <button
                onClick={() => setTab("price")}
                className={`px-4 py-2 font-medium border-b-4 ${
                  tab === "price"
                    ? "border-[#4b1e59] text-[#4b1e59]"
                    : "border-transparent text-gray-500"
                }`}
              >
                Price Breakup
              </button>
            </div>

            {/* Tab Content */}
            {tab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Metal Details</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>{product.karatage} Karatage</li>
                    <li>{product.materialColour} Material Colour</li>
                    <li>{product.grossWeight}g Gross Weight</li>
                    <li>{product.metal} Metal</li>
                    <li>{product.size} MM Size</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Diamond Details</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>{product.diamondClarity} Diamond Clarity</li>
                    <li>{product.diamondColor} Diamond Color</li>
                    <li>{product.numberOfDiamonds} No. of Diamonds</li>
                    <li>{product.diamondSetting} Diamond Setting</li>
                    <li>{product.diamondShape} Diamond Shape</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">General Details</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>{product.jewelleryType}</li>
                    <li>Brand: {product.brand}</li>
                    <li>Collection: {product.collection}</li>
                    <li>Gender: {product.gender}</li>
                    <li>Occasion: {product.occasion}</li>
                  </ul>
                </div>
              </div>
            )}

            {tab === "price" && (
              <div className="text-gray-700">
                <p>This section can include gold price, diamond cost, making charges, etc.</p>
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="mt-6 w-full bg-[#4b1e59] hover:bg-[#3a1547] text-white font-bold py-3 rounded-lg transition duration-300"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
