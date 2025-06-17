import React, { useState } from "react";
import { useCart } from "../context/CartContext";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    billingAddress: "",
    deliveryAddress: "",
    phone: "",
    paymentMethod: "cod",
  });

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
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
      <h2 className="text-3xl font-bold mb-6 text-center text-[#d4af37]">🧾 Checkout</h2>

      {/* ✅ Login Tick */}
      <div className="mb-6 flex items-center gap-2 text-green-600 font-medium">
        <span>✔</span>
        <p>Logged in with phone number</p>
      </div>

      {/* ✅ Cart Summary */}
      <div className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
        {cartItems.length === 0 ? (
          <p className="text-[#8a7653]">Your cart is empty.</p>
        ) : (
          <ul className="divide-y divide-[#f4e0b9] mb-4">
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
        <p className="font-bold text-right text-[#c29d5f]">
          Total: ₹ {total.toLocaleString()}
        </p>
      </div>

      {/* ✅ Customer Details */}
      {cartItems.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md space-y-4"
        >
          <h3 className="text-xl font-semibold text-[#3e2f1c]"> Customer Details</h3>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={customer.name}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={customer.email}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={customer.phone}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          {/* ✅ Billing Address */}
          <textarea
            name="billingAddress"
            placeholder="Billing Address"
            value={customer.billingAddress}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          {/* ✅ Delivery Address */}
          <textarea
            name="deliveryAddress"
            placeholder="Delivery Address"
            value={customer.deliveryAddress}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          {/* ✅ Payment Options */}
          <div>
            <h4 className="text-md font-semibold mb-2">💳 Payment Options</h4>
            <label className="block mb-1">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={customer.paymentMethod === "cod"}
                onChange={handleChange}
              />{" "}
              Cash on Delivery
            </label>
            <label className="block">
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={customer.paymentMethod === "upi"}
                onChange={handleChange}
              />{" "}
              UPI / Online Payment
            </label>
          </div>

          {/* ✅ Security Note */}
          <div className="text-sm text-[#5f4d2d] bg-[#fff7e3] p-3 rounded border border-[#f3e4b5]">
            <p>✔ Safe and secure payments</p>
            <p>✔ Easy returns</p>
            <p>✔ 100% Authentic products</p>
          </div>

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
