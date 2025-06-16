import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext"; // ✅ Correct hook import


const CartPage = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();

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
                className="border p-4 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ₹ {item.price.toLocaleString()} x {item.quantity}
                  </p>
                </div>
                <button
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => removeFromCart(item.id)}
                >
                  ❌ Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right text-lg font-bold">
            Total: ₹ {total.toLocaleString()}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={clearCart}
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
