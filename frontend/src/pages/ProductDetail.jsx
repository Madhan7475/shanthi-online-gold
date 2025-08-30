import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useRequireAuth } from "../utils/useRequireAuth";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { runWithAuth } = useRequireAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`
        );
        setProduct(res.data);
        setSelectedImage(res.data.images?.[0] || null);
      } catch (err) {
        console.error("❌ Error loading product:", err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    runWithAuth(() => addToCart(product));
  };

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-4">
        Home &gt; Product &gt;{" "}
        <span className="text-[#4b1e59] font-semibold">{product.title}</span>
      </div>

      {/* Product Content - Image Left, Details Right */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image Section */}
        <div className="flex flex-col items-center">
          <div className="w-full border rounded-lg mb-4 overflow-hidden bg-white">
            {selectedImage ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${selectedImage}`}
                alt={product.title}
                className="w-full h-[320px] object-contain"
              />
            ) : (
              <div className="w-full h-[320px] flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex space-x-3">
            {product.images?.map((img, idx) => (
              <img
                key={idx}
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${img}`}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 object-cover border rounded-md cursor-pointer transition ${selectedImage === img
                  ? "border-[#4b1e59] ring-2 ring-[#4b1e59]"
                  : "border-gray-300"
                  }`}
                alt={`View ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div>
          {/* Title & Price */}
          <h1 className="text-3xl font-bold mb-1">{product.title}</h1>
          <p className="text-2xl text-[#4b1e59] font-bold">
            ₹{product.price?.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mb-4">Incl. taxes and charges</p>

          {/* Product Details Tab */}
          <div className="border-b border-gray-300 mb-4">
            <span className="inline-block px-4 py-2 font-medium border-b-4 border-[#4b1e59] text-[#4b1e59]">
              Product Details
            </span>
          </div>

          {/* Metal & Diamond Details */}
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Metal Details</h4>
              <ul className="space-y-1">
                <li>{product.karatage} Karatage</li>
                <li>{product.materialColour} Material Colour</li>
                <li>{product.grossWeight}g Gross Weight</li>
                <li>{product.metal} Metal</li>
                <li>{product.size} MM Size</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Diamond Details</h4>
              <ul className="space-y-1">
                <li>{product.diamondClarity} Diamond Clarity</li>
                <li>{product.diamondColor} Diamond Color</li>
                <li>{product.numberOfDiamonds} No. of Diamonds</li>
                <li>{product.diamondSetting} Diamond Setting</li>
                <li>{product.diamondShape} Diamond Shape</li>
              </ul>
            </div>
          </div>

          {/* General Details */}
          <div className="mt-4 text-sm text-gray-700">
            <h4 className="font-semibold text-gray-800 mb-2">General Details</h4>
            <ul className="space-y-1">
              <li>{product.jewelleryType}</li>
              <li>Brand: {product.brand}</li>
              <li>Collection: {product.collection}</li>
              <li>Gender: {product.gender}</li>
              <li>Occasion: {product.occasion}</li>
            </ul>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="mt-6 w-full bg-[#4b1e59] hover:bg-[#3a1547] text-white font-bold py-3 rounded-lg transition duration-300"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
