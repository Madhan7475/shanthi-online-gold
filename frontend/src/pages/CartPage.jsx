import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useRequireAuth } from "../utils/useRequireAuth";

const CartPage = () => {
  const { loading, isAuthenticated } = useRequireAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveForItemLater,
  } = useCart();

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (loading || !isAuthenticated)
    return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="bg-[#fffdf6] px-4 lg:px-20 py-10 text-[#3e2f1c] min-h-screen">
      <Link
        to="/"
        className="text-sm text-[#9e886e] underline mb-4 inline-block hover:text-[#b19874]"
      >
        ← Continue Shopping
      </Link>

      <h2 className="text-2xl font-semibold mb-6 text-[#d4af37]">
        Shopping Bag ({cartItems.length})
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length > 0 && (
            <div className="text-right">
              <button
                onClick={clearCart}
                className="text-sm border border-[#c29d5f] text-[#c29d5f] px-4 py-1 rounded hover:bg-[#fdf5e9] transition"
              >
                REMOVE ALL
              </button>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-500">Your cart is empty.</p>
              <Link to="/" className="text-[#c29d5f] underline mt-2 inline-block">
                Start Shopping
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item._id}
                className="border-b border-[#f4e0b9] pb-6 flex flex-col sm:flex-row justify-between gap-4"
              >
                <img
                  src={
                    item.images?.[0]
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${item.images[0]}`
                      : "/placeholder.png"
                  }
                  alt={item.title}
                  className="w-24 h-24 object-contain border border-[#f4e0b9] rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#3e2f1c]">{item.title}</h3>
                  <p className="text-xs text-[#9e886e]">SKU : {item._id}</p>
                  <p className="text-sm mt-2">
                    <span className="text-[#6c553f]">Stock:</span>{" "}
                    <span className="text-red-600 font-medium">Only few left</span>
                  </p>
                  <p className="text-sm text-[#9e886e] mt-1">Size : </p>
                  <button
                    onClick={() => saveForItemLater(item)}
                    className="text-xs text-[#c29d5f] mt-1 underline cursor-pointer hover:text-[#a8824a]"
                  >
                    Save for Later
                  </button>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <select
                    className="border border-[#f4e0b9] px-2 py-1 text-sm rounded mb-2"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item._id, parseInt(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <p className="text-lg font-semibold text-[#3e2f1c]">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-xs text-[#9e886e] mt-1 hover:text-red-500"
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))
          )}

          {cartItems.length > 0 && (
            <div className="pt-6 flex justify-center">
              <img
                src="/payment-icons.png"
                alt="Payment Methods"
                className="w-24 sm:w-60 md:w-72"
              />
            </div>
          )}
        </div>

        {/* Right Section */}
        {cartItems.length > 0 && (
          <div className="bg-white border border-[#f4e0b9] p-6 rounded-xl shadow-md h-fit">
            <h3 className="text-xl font-semibold mb-4 text-[#3e2f1c]">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm text-[#3e2f1c]">
              <div className="flex justify-between">
                <span>Price ({cartItems.length} items)</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Coupon Discount</span>
                <span className="text-[#c29d5f]">Can Apply Coupons</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge (Standard)</span>
                <span className="text-[#3e2f1c]">Free</span>
              </div>
            </div>
            <hr className="my-4 border-[#f4e0b9]" />
            <div className="flex justify-between font-bold text-md text-[#3e2f1c]">
              <span>Estimated Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <Link
              to="/checkout"
              className="mt-6 block w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-2 rounded text-center hover:opacity-90 transition"
            >
              CONTINUE TO CHECKOUT
            </Link>

            <div className="mt-4 text-center text-xs text-[#9e886e]">
              <div>✔ Safe and secure payments. Easy returns.</div>
              <div>100% Authentic products</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
