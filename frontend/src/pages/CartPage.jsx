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
    <div className="bg-white px-4 lg:px-20 py-10 text-gray-800">
      <Link to="/products" className="text-sm text-gray-600 underline mb-4 inline-block">Continue Shopping</Link>

      <h2 className="text-2xl font-medium mb-6">Shopping Bag ({cartItems.length})</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-right">
            <button
              onClick={clearCart}
              className="text-sm border border-yellow-600 text-yellow-600 px-4 py-1 rounded hover:bg-yellow-50"
            >
              REMOVE ALL
            </button>
          </div>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="border-b pb-6 flex flex-col sm:flex-row justify-between gap-4"
            >
              {/* Product Image */}
              <img
                src={item.img || "/placeholder.png"}
                alt={item.name}
                className="w-24 h-24 object-contain"
              />

              {/* Product Info */}
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-gray-500">SKU : {item.id}</p>
                <p className="text-sm mt-2">
                  <span className="text-gray-600">Stock:</span>{" "}
                  <span className="text-red-600 font-medium">Only few left</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">Size : </p>
                <p className="text-xs text-yellow-700 mt-1 underline">Save for Later</p>
              </div>

              {/* Price + Quantity */}
              <div className="flex flex-col items-end justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <select
                    className="border px-2 py-1 text-sm"
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
                <p className="text-lg font-semibold">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-xs text-gray-500 mt-1 hover:text-red-500"
                >
                  ✖
                </button>
              </div>
            </div>
          ))}

          {/* Payment Icons */}
          <div className="pt-6">
            <img
              src="/images/payment-icons.png" // Update this path
              alt="Payment Methods"
              className="w-full max-w-xl"
            />
          </div>
        </div>

        {/* Right Section: Summary */}
        <div className="bg-gray-50 p-6 rounded shadow-sm h-fit">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Price ({cartItems.length} items)</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Coupon Discount</span>
              <span className="text-yellow-600">Can Apply Coupons</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge (Standard)</span>
              <span>Free</span>
            </div>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-md">
            <span>Estimated Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>

          <Link
            to="/checkout"
            className="mt-6 block w-full bg-[#B28972] text-white py-2 rounded text-center hover:bg-[#9f7865] transition"
          >
            CONTINUE TO CHECKOUT
          </Link>

          <div className="mt-4 text-center text-xs text-gray-500">
            <div>✔ Safe and secure payments. Easy returns.</div>
            <div>100% Authentic products</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
