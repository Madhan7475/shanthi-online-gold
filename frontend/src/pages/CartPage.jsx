import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

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
        {/* Left Section: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-right">
            <button
              onClick={clearCart}
              className="text-sm border border-[#c29d5f] text-[#c29d5f] px-4 py-1 rounded hover:bg-[#fdf5e9] transition"
            >
              REMOVE ALL
            </button>
          </div>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border-b border-[#f4e0b9] pb-6 flex flex-col sm:flex-row justify-between gap-4"
            >
              {/* Product Image */}
              <img
                src={item.img || "/placeholder.png"}
                alt={item.name}
                className="w-24 h-24 object-contain border border-[#f4e0b9] rounded"
              />

              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-[#3e2f1c]">{item.name}</h3>
                <p className="text-xs text-[#9e886e]">SKU : {item.id}</p>
                <p className="text-sm mt-2">
                  <span className="text-[#6c553f]">Stock:</span>{" "}
                  <span className="text-red-600 font-medium">Only few left</span>
                </p>
                <p className="text-sm text-[#9e886e] mt-1">Size : </p>
                <p className="text-xs text-[#c29d5f] mt-1 underline cursor-pointer">
                  Save for Later
                </p>
              </div>

              {/* Price + Quantity */}
              <div className="flex flex-col items-end justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <select
                    className="border border-[#f4e0b9] px-2 py-1 text-sm rounded"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, parseInt(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <p className="text-lg font-semibold text-[#3e2f1c]">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-xs text-[#9e886e] mt-1 hover:text-red-500"
                >
                  ✖
                </button>
              </div>
            </div>
          ))}

          {/* Payment Icons */}
          <div className="pt-6 flex justify-center">
            <img
              src="/payment-icons.png"
              alt="Payment Methods"
              className="w-24 sm:w-60 md:w-72"
            />
          </div>
        </div>

        {/* Right Section: Summary */}
        <div className="bg-white border border-[#f4e0b9] p-6 rounded-xl shadow-md h-fit">
          <h3 className="text-xl font-semibold mb-4 text-[#3e2f1c]">Order Summary</h3>
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
      </div>
    </div>
  );
};

export default CartPage;
