import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useRequireAuth } from "../utils/useRequireAuth";

const SavedItemsPage = () => {
    const { savedItems, moveToCart, removeFromSaved, fetchWishlist, loading } = useCart();
    const { loading: authLoading, isAuthenticated } = useRequireAuth();

    // Fetch wishlist items when component mounts
    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated, fetchWishlist]);

    if (authLoading || !isAuthenticated) {
        return <div className="text-center py-20">Loading...</div>;
    }

    return (
        <div className="bg-[#fffdf6] px-4 lg:px-20 py-10 text-[#3e2f1c] min-h-screen">
            <Link
                to="/"
                className="text-sm text-[#9e886e] underline mb-4 inline-block hover:text-[#b19874]"
            >
                ← Continue Shopping
            </Link>

            <h2 className="text-2xl font-semibold mb-6 text-[#d4af37]">
                Saved For Later ({savedItems.length})
            </h2>

            {loading && (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500">Loading saved items...</p>
                </div>
            )}

            {!loading && savedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {savedItems.map((item) => (
                        <div
                            key={item._id}
                            className="border border-[#f4e0b9] bg-white p-4 rounded-xl shadow-sm flex flex-col"
                        >
                            <img
                                src={
                                    (item.product?.images?.[0] || item.images?.[0]) 
                                        ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${item.product?.images?.[0] || item.images?.[0]}` 
                                        : "/placeholder.png"
                                }
                                alt={item.product?.title || item.title}
                                className="w-full h-48 object-contain rounded mb-4"
                            />
                            <div className="flex-1 flex flex-col">
                                <h3 className="font-semibold text-[#3e2f1c] flex-1">
                                    {item.product?.title || item.title || "Untitled Product"}
                                </h3>
                                <p className="text-lg font-semibold text-[#3e2f1c] mt-2">
                                    ₹{(item.product?.price || item.price) ? (item.product?.price || item.price).toLocaleString() : "Price not available"}
                                </p>
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={() => moveToCart(item)}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-2 rounded text-center hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Moving..." : "Move to Cart"}
                                    </button>
                                    <button
                                        onClick={() => removeFromSaved(item._id)}
                                        disabled={loading}
                                        className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Removing..." : "Remove"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="text-center py-20">
                        <p className="text-lg text-gray-500">You have no saved items yet.</p>
                        <Link to="/" className="text-[#c29d5f] underline mt-2 inline-block">
                            Discover beautiful jewellery
                        </Link>
                    </div>
                )
            )}
        </div>
    );
};

export default SavedItemsPage;
