import React, { useState } from "react";
import useCart from "../context/useCart";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

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

    // Save to localStorage (simulate backend call)
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([...allOrders, order]));

    clearCart();
    alert("Order placed successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Your Cart</h3>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul className="divide-y">
            {cartItems.map((item) => (
              <li key={item.id} className="py-2 flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹ {item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 font-bold">Total: ₹ {total.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <h3 className="text-lg font-semibold">Delivery Information</h3>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={customer.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={customer.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={customer.phone}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="address"
          placeholder="Delivery Address"
          value={customer.address}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Place Order
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
