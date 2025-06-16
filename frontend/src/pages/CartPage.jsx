import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

const CartPage = () => {
  const { cartItems, updateQuantity, clearCart } = useContext(CartContext);

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-gradient-to-b from-yellow-50 to-white min-h-screen py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 sm:p-12">
        <h2 className="text-4xl font-extrabold text-yellow-600 mb-8 text-center">
          🛒 Your Shopping Cart
        </h2>

        {cartItems.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">😔 Your cart is empty. Let's shop!</p>
            <Link
              to="/"
              className="mt-6 inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
            >
              🛍️ Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center justify-between py-6"
                >
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg shadow border"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                      <p className="text-yellow-600 font-bold text-lg mt-1">
                        ₹ {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-lg font-bold w-9 h-9 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full"
                    >
                      −
                    </button>
                    <span className="text-xl font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-lg font-bold w-9 h-9 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Actions */}
            <div className="mt-12 sm:mt-14 text-right space-y-6">
              <p className="text-3xl font-extrabold text-gray-800">
                Total: ₹ {total.toLocaleString()}
              </p>

              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  onClick={clearCart}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
                >
                  🧹 Clear Cart
                </button>

                <Link
                  to="/checkout"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition text-center"
                >
                  ✅ Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
