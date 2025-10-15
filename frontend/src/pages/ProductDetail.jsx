import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useRequireAuth } from "../utils/useRequireAuth";
import { productCache } from "../utils/productCache";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { runWithAuth } = useRequireAuth();
  const inCart = product && cartItems?.some((ci) => String(ci.productId) === String(product._id));

  useEffect(() => {
    let active = true;

    // Seed from in-memory cache for instant paint (if available)
    const cached = productCache.get(id);
    if (cached) {
      setProduct(cached);
      setSelectedImage(cached.images?.[0] || null);
    }

    const controller = new AbortController();
    const fetchProduct = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`,
          { signal: controller.signal, headers: { "Cache-Control": "no-store" } }
        );
        if (!active) return;
        setProduct(res.data);
        // Only set initial image if user hasn't already chosen one
        setSelectedImage((prev) => (prev ? prev : (res.data.images?.[0] || null)));
        productCache.set(id, res.data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("❌ Error loading product:", err);
      }
    };
    fetchProduct();

    return () => {
      active = false;
      try { controller.abort(); } catch { }
    };
  }, [id]);


  const handleAddToCart = () => {
    if (inCart || isAdding) return;
    setIsAdding(true);
    runWithAuth(async () => {
      try {
        await addToCart(product);
      } finally {
        setIsAdding(false);
      }
    });
  };

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  // Derived values for price breakup (prefer backend-provided priceBreakup)
  const parseGrams = (s) => {
    const n = parseFloat(String(s || "").replace(/[^\d.]/g, ""));
    return isNaN(n) ? null : n;
  };
  const pb = product?.priceBreakup || null;
  const gw = pb?.weightGrams ?? parseGrams(product?.grossWeight);
  const karatNum = pb?.karat ?? parseInt(String(product?.karatage || "22"), 10);
  const goldRate = pb?.goldRatePerGramInr ?? null;
  const goldValue = pb?.goldValue ?? (gw != null && goldRate != null ? Math.round(gw * goldRate) : null);
  // Derive displayRate from backend's value/weight for perfect consistency with displayed Value
  const displayRate =
    pb?.goldValue != null && gw != null && gw > 0 ? pb.goldValue / gw : goldRate;
  const karatLabel = karatNum || 22;

  const mcType = pb?.makingCharge?.type ?? product?.makingCharge?.type ?? null;
  const mcAmt = pb?.makingCharge?.ratePerGram ?? Number(product?.makingCharge?.amount || 0);
  const mcValue =
    pb?.makingCharge?.value ??
    (mcType === "variable" && gw != null
      ? Math.round(gw * mcAmt)
      : mcType === "fixed"
        ? Math.round(mcAmt)
        : null);

  const mcDiscountPct = pb?.makingCharge?.discountPercent ?? product?.makingCharge?.discountPercent;
  const mcValueDiscounted =
    pb?.makingCharge?.valueDiscounted ??
    (mcValue != null && Number.isFinite(Number(mcDiscountPct))
      ? Math.round(mcValue * (1 - Math.max(0, Math.min(100, Number(mcDiscountPct))) / 100))
      : mcValue);

  const totalValue = (goldValue != null ? goldValue : 0) + (mcValueDiscounted != null ? mcValueDiscounted : 0);
  // Show persisted DB price in the heading; prefer a positive backend total; else DB price; else computed fallback
  const displayPrice =
    (Number.isFinite(pb?.total) && pb.total > 0)
      ? pb.total
      : (Number.isFinite(product?.price) && product.price > 0)
        ? product.price
        : (Number.isFinite(totalValue) && totalValue > 0 ? totalValue : null);

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
                loading="lazy"
                decoding="async"
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
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div>
          {/* Title & Price */}
          <h1 className="text-3xl font-bold mb-1">{product.title}</h1>
          <p className="text-2xl text-[#4b1e59] font-bold">
            {Number.isFinite(displayPrice) && displayPrice > 0
              ? `₹${Math.round(displayPrice).toLocaleString()}`
              : (Number.isFinite(product?.price) && product.price > 0
                ? `₹${Math.round(product.price).toLocaleString()}`
                : "—")}
          </p>
          <p className="text-sm text-gray-500">Incl. taxes and charges</p>
          {displayRate != null && (
            <p className="text-xs text-gray-500 mb-2">
              {"Live rate: ₹ " +
                Number(displayRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
                "/g • " +
                karatLabel +
                "K • " +
                (pb?.goldRates?.source || "Live") +
                (pb?.goldRates?.lastUpdated ? " • " + pb.goldRates.lastUpdated : "")}
            </p>
          )}
          {product?.priceBreakup?.makingCharge?.waived && (
            <div className="mb-4 text-sm text-green-700">Making charges waived</div>
          )}

          {/* Product Details Tab */}
          <div className="border-b border-gray-300 mb-4">
            <span className="inline-block px-4 py-2 font-medium border-b-4 border-[#4b1e59] text-[#4b1e59]">
              Product Details
            </span>
          </div>

          {/* Metal & Diamond Details */}
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
            {(() => {
              const metalRows = [];
              if (product.karatage) metalRows.push(`Karatage: ${product.karatage}`);
              if (product.materialColour) metalRows.push(`Material Colour: ${product.materialColour}`);
              if (gw != null) metalRows.push(`Gross Weight: ${gw.toFixed(3)} g`);
              if (product.metal) metalRows.push(`Metal: ${product.metal}`);
              if (product.size) {
                const m = String(product.size).match(/\d+(?:\.\d+)?/);
                const sizeVal = m ? parseFloat(m[0]) : null;
                metalRows.push(`Size: ${sizeVal != null ? sizeVal.toFixed(2) + " mm" : String(product.size)}`);
              }
              return metalRows.length ? (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Metal Details</h4>
                  <ul className="space-y-1">
                    {metalRows.map((text, i) => <li key={i}>{text}</li>)}
                  </ul>
                </div>
              ) : null;
            })()}
            {(() => {
              const diamondRows = [];
              if (product.diamondClarity) diamondRows.push(`Diamond Clarity: ${product.diamondClarity}`);
              if (product.diamondColor) diamondRows.push(`Diamond Color: ${product.diamondColor}`);
              if (product.numberOfDiamonds) diamondRows.push(`No. of Diamonds: ${product.numberOfDiamonds}`);
              if (product.diamondSetting) diamondRows.push(`Diamond Setting: ${product.diamondSetting}`);
              if (product.diamondShape) diamondRows.push(`Diamond Shape: ${product.diamondShape}`);
              return diamondRows.length ? (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Diamond Details</h4>
                  <ul className="space-y-1">
                    {diamondRows.map((text, i) => <li key={i}>{text}</li>)}
                  </ul>
                </div>
              ) : null;
            })()}
          </div>

          {/* Price Breakup */}
          <div className="mt-6 text-sm text-gray-700">
            <h4 className="font-semibold text-gray-800 mb-2">Price Breakup</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Component</th>
                    <th className="text-left px-4 py-2">Weight</th>
                    <th className="text-left px-4 py-2">Rate</th>
                    <th className="text-left px-4 py-2">Discount</th>
                    <th className="text-left px-4 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2">
                      {`${karatLabel} KT ${product.materialColour || "Gold"}`}
                    </td>
                    <td className="px-4 py-2">{gw != null ? `${gw.toFixed(3)} g` : "—"}</td>
                    <td className="px-4 py-2">
                      {displayRate != null
                        ? `₹ ${Number(displayRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /g`
                        : "—"}
                    </td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">{goldValue != null ? `₹ ${Math.round(goldValue).toLocaleString()}` : "—"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">Making Charges</td>
                    <td className="px-4 py-2">
                      {mcType === "variable" && gw != null ? `${gw.toFixed(3)} g` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {mcType === "variable"
                        ? `₹ ${Number(product?.makingCharge?.amount || 0).toLocaleString()} /g`
                        : mcType === "fixed"
                          ? `₹ ${Number(product?.makingCharge?.amount || 0).toLocaleString()}`
                          : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {pb?.makingCharge?.waived ? "Waived 100%" : (mcDiscountPct != null ? `${mcDiscountPct}%` : "—")}
                    </td>
                    <td className="px-4 py-2">
                      {mcValueDiscounted != null ? `₹ ${Math.round(mcValueDiscounted).toLocaleString()}` : "—"}
                      {mcDiscountPct != null && mcDiscountPct > 0 && mcValue != null && (
                        <div className="text-xs text-gray-500">Orig: ₹ {Math.round(mcValue).toLocaleString()}</div>
                      )}
                    </td>
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="px-4 py-2 font-semibold">Total</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2 font-semibold">
                      {Number.isFinite(pb?.total) && pb.total > 0
                        ? `₹ ${Math.round(pb.total).toLocaleString()}`
                        : Number.isFinite(product?.price) && product.price > 0
                          ? `₹ ${Math.round(product.price).toLocaleString()}`
                          : (Number.isFinite(totalValue) && totalValue > 0 ? `₹ ${Math.round(totalValue).toLocaleString()}` : "—")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {goldRate == null && (
              <p className="text-xs text-gray-500 mt-2">Live gold rate unavailable. Values shown exclude live rate.</p>
            )}
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
            disabled={isAdding || inCart}
            className="mt-6 w-full bg-[#4b1e59] hover:bg-[#3a1547] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition duration-300"
          >
            {inCart ? "In Cart" : isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
