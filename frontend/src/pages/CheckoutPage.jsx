import React, { useState, useContext } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: user?.name || "",
    email: user?.email || "",
    billingAddress: "",
    deliveryAddress: "",
    phone: user?.phone || "",
    paymentMethod: "cod",
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "billingAddress" && sameAsBilling) {
      setCustomer((prev) => ({
        ...prev,
        billingAddress: value,
        deliveryAddress: value,
      }));
    } else {
      setCustomer((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSameAsBilling = (e) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    setCustomer((prev) => ({
      ...prev,
      deliveryAddress: checked ? prev.billingAddress : "",
    }));
  };

  const handleCODOrder = async () => {
    try {
      const orderData = { customer, items: cartItems, total };
      const res = await axiosInstance.post('/orders/cod', orderData);
      toast.success(res.data.msg || "🎉 Order placed successfully!");
      clearCart();
      navigate("/my-orders");
    } catch (error) {
      console.error("COD order submission failed:", error);
      toast.error(error.response?.data?.msg || "Could not place order.");
    }
  };

  const handleOnlinePayment = async () => {
    try {
      // 1. Create a Razorpay Order on the backend
      const { data: order } = await axiosInstance.post("/payment/create-order", {
        amount: total,
        receipt: `receipt_order_${new Date().getTime()}`,
      });

      // 2. Configure Razorpay options
      const options = {
        key: "YOUR_TEST_KEY_ID", // IMPORTANT: Replace with your actual Razorpay Test Key ID
        amount: order.amount,
        currency: order.currency,
        name: "Shanthi Online Gold",
        description: "Order Payment",
        image: "/logo.svg",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify the payment on the backend
          const verificationData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderData: { customer, items: cartItems, total },
          };

          const { data: verificationResult } = await axiosInstance.post(
            "/payment/verify",
            verificationData
          );

          toast.success(verificationResult.msg || "Payment successful!");
          clearCart();
          navigate("/my-orders");
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: "#400F45" },
      };

      // 4. Open the Razorpay payment modal
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed. Please try again.");
        console.error(response.error);
      });
      rzp.open();

    } catch (error) {
      toast.error("An error occurred while initiating payment.");
      console.error("Payment process error:", error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    if (customer.paymentMethod === "cod") {
      await handleCODOrder();
    } else {
      await handleOnlinePayment();
    }

    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#fffdf6] text-[#3e2f1c] min-h-[90vh]">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#d4af37]">🧾 Checkout</h2>

      <div className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
        {cartItems.length === 0 ? (
          <p className="text-[#8a7653]">Your cart is empty.</p>
        ) : (
          <ul className="divide-y divide-[#f4e0b9] mb-4">
            {cartItems.map((item) => (
              <li key={item._id} className="py-2 flex justify-between text-sm">
                <span>
                  {item.title} × {item.quantity}
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

          <textarea
            name="billingAddress"
            placeholder="Billing Address"
            value={customer.billingAddress}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f]"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={handleSameAsBilling}
            />
            Delivery address is the same as billing address
          </label>

          <textarea
            name="deliveryAddress"
            placeholder="Delivery Address"
            value={customer.deliveryAddress}
            onChange={handleChange}
            required
            readOnly={sameAsBilling}
            className={`w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] ${sameAsBilling ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />

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

          <div className="text-sm text-[#5f4d2d] bg-[#fff7e3] p-3 rounded border border-[#f3e4b5]">
            <p>✔ Safe and secure payments</p>
            <p>✔ Easy returns</p>
            <p>✔ 100% Authentic products</p>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : '🛍️ Place Order'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
