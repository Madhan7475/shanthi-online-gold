import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartAuthGuard from "../components/CartAuthGuard";

const CartPage = () => {
  const {
    cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveForItemLater,
  } = useCart();

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartAuthGuard>
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

        {loading && (
          <div className="text-center py-8">
            <div className="text-[#c29d5f]">Loading cart...</div>
          </div>
        )}

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
                      item.imageUrl
                        ? item.imageUrl
                        : item.image
                          ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${item.image}`
                          : item.images?.[0]
                            ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${item.images[0]}`
                            : item.product?.primaryImageUrl
                              ? item.product.primaryImageUrl
                              : item.product?.imageUrls?.[0]
                                ? item.product.imageUrls[0]
                                : "/placeholder.png"
                    }
                    alt={item.name || item.title || "Cart item"}
                    className="w-24 h-24 object-contain border border-[#f4e0b9] rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#3e2f1c]">{item.name || item.title}</h3>
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
              <div className="mt-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Purity Guaranteed */}
                  <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="w-12 h-12 text-[#400F45]"
                      fill="currentColor"
                    >
                      <path d="M12 2.25l8.485 3.03c.3.107.515.39.515.707V12c0 5.25-3.25 9.75-9 11.25C6.25 21.75 3 17.25 3 12V6c0-.317.215-.6.515-.707L12 2.25z" />
                      <path d="M10.25 12.5l1.75 1.75 3.75-3.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-[#3e2f1c]">Purity Guaranteed</div>
                      <div className="text-sm text-gray-600">on every online purchases</div>
                    </div>
                  </div>

                  {/* Secure Delivery */}
                  <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="w-12 h-12 text-[#400F45]"
                      fill="currentColor"
                    >
                      <path d="M2.75 7.5h10.5v7.5H2.75z" />
                      <path d="M13.25 7.5h4.25l3.75 3.75V15h-8V7.5z" />
                      <circle cx="7" cy="18" r="2.5" />
                      <circle cx="17" cy="18" r="2.5" />
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-[#3e2f1c]">Secure Delivery</div>
                      <div className="text-sm text-gray-600">by our trusted partners</div>
                    </div>
                  </div>

                  {/* Easy & Secure Payments (PhonePe) */}
                  <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
                    <svg
                      role="img"
                      aria-label="PhonePe payments"
                      viewBox="0 0 24 24"
                      className="w-12 h-12"
                    >
                      <circle cx="12" cy="12" r="11" fill="#5F259F" />
                      <text
                        x="12"
                        y="12"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        पे
                      </text>
                    </svg>
                    <div>
                      <div className="text-lg font-semibold text-[#3e2f1c]">Easy & Secure Payments</div>
                      <div className="text-sm text-gray-600">backed by the trust of PhonePe</div>
                    </div>
                  </div>
                </div>
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
    </CartAuthGuard>
  );
};

export default CartPage;
