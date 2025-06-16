// src/pages/CartPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const {
    cartItems,
    updateQuantity,      // ✅ now available
    removeFromCart,
    clearCart
  } = useCart();

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-screen-md mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-yellow-800">🛒 Your Cart</h2>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="border p-4 rounded shadow flex flex-col sm:flex-row justify-between items-center"
              >
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ₹ {item.price.toLocaleString()}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 my-2 sm:my-0">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    +
                  </button>
                </div>

                <div className="flex-1 text-right space-y-2">
                  <p className="font-bold">
                    ₹ {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ❌ Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right text-lg font-bold">
            Total: ₹ {total.toLocaleString()}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={clearCart}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🧹 Clear Cart
            </button>
            <Link
              to="/checkout"
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              🧾 Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
