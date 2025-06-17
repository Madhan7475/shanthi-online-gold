import React, { useState } from "react";
import { useCart } from "../context/CartContext";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const order = {
      customer,
      items: cartItems,
      total,
      date: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([...existingOrders, order]));

    clearCart();
    alert("🎉 Order placed successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#fffdf6] text-[#3e2f1c] min-h-[90vh]">
      <h2 className="text-3xl font-bold mb-6 text-[#d4af37] text-center">
        🧾 Checkout
      </h2>

      <div className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4 text-[#3e2f1c]">Your Cart</h3>
        {cartItems.length === 0 ? (
          <p className="text-[#8a7653]">Your cart is empty.</p>
        ) : (
          <ul className="divide-y divide-[#f4e0b9]">
            {cartItems.map((item) => (
              <li key={item.id} className="py-2 flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹ {(item.price * item.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 font-bold text-right text-[#c29d5f]">
          Total: ₹ {total.toLocaleString()}
        </p>
      </div>

      {cartItems.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md space-y-4"
        >
          <h3 className="text-xl font-semibold text-[#3e2f1c]">
            Delivery Information
          </h3>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={customer.name}
            onChange={handleChange}
            required
            className="w-full border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] p-2 bg-[#fffdf6]"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={customer.email}
            onChange={handleChange}
            required
            className="w-full border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] p-2 bg-[#fffdf6]"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={customer.phone}
            onChange={handleChange}
            required
            className="w-full border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] p-2 bg-[#fffdf6]"
          />

          <textarea
            name="address"
            placeholder="Delivery Address"
            value={customer.address}
            onChange={handleChange}
            required
            className="w-full border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] p-2 bg-[#fffdf6]"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-2 rounded hover:opacity-90 transition"
          >
            🛍️ Place Order
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
