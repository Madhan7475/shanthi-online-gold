import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { cartService } from "../services/cartService";
import { toast } from "react-toastify";
import CartAuthGuard from "../components/CartAuthGuard";

const CheckoutPage = () => {
  const { cartItems, clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: user?.name || "",
    email: user?.email || "",
    billingAddress: "",
    deliveryAddress: "",
    phone: "",
    paymentMethod: "upi",
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const total = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  );

  // ✅ Validators
  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(String(phone));
  const validateEmail = (email) =>
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase()
    );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      setCustomer((prev) => ({ ...prev, [name]: numericValue }));
      setPhoneError(
        numericValue && !validatePhone(numericValue)
          ? "Enter a valid 10-digit mobile number."
          : ""
      );
      return;
    }

    if (name === "email") {
      setCustomer((prev) => ({ ...prev, [name]: value }));
      setEmailError(
        value && !validateEmail(value) ? "Enter a valid email address." : ""
      );
      return;
    }

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

  // ✅ PhonePe payment with new cart API (create payment first to obtain transactionId)
  const handlePhonePePayment = async () => {
    try {
      setIsProcessing(true);

      const orderData = { customer, items: cartItems, total };

      // Step 1: Create PhonePe order to obtain merchantTransactionId
      const { data: paymentInit } = await axiosInstance.post("/payment/create-order", {
        amount: total,
        orderData,
      });

      if (!paymentInit) {
        toast.error("Could not initiate payment. Try again.");
        setIsProcessing(false);
        return;
      }

      const transactionId = paymentInit.merchantTransactionId || paymentInit.data?.merchantTransactionId;
      if (!transactionId) {
        toast.error("Payment transaction ID missing.");
        setIsProcessing(false);
        return;
      }

      // Step 2: Create order in our system with transactionId (required by backend)
      const checkoutResponse = await cartService.checkout({
        customer,
        items: cartItems,
        total,
        paymentMethod: 'phonepe',
        transactionId,
      });

      if (!checkoutResponse?.success) {
        toast.error("Failed to create order. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Step 3: Redirect to PhonePe hosted page
      const redirectUrl = paymentInit?.data?.instrumentResponse?.redirectInfo?.url;
      if (redirectUrl) {
        await fetchCart(); // cart cleared by checkout; refresh state
        window.location.href = redirectUrl;
      } else {
        toast.error("Could not open PhonePe payment page.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("❌ PhonePe order error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Payment request failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone(customer.phone)) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!validateEmail(customer.email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    await handlePhonePePayment();
  };

  const isFormValid =
    validatePhone(customer.phone) &&
    validateEmail(customer.email) &&
    customer.name &&
    customer.billingAddress &&
    customer.deliveryAddress;

  return (
    <CartAuthGuard>
      <div className="max-w-4xl mx-auto p-6 bg-[#fffdf6] text-[#3e2f1c] min-h-[90vh]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#d4af37]">
          🧾 Checkout
        </h2>

      {/* 🛒 Order Summary */}
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

      {/* 🧾 Customer Form */}
      {cartItems.length > 0 && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md space-y-4"
        >
          <h3 className="text-xl font-semibold text-[#3e2f1c]">
            Customer Details
          </h3>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={customer.name}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={customer.email}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none"
          />
          {emailError && (
            <p className="text-red-500 text-xs -mt-2">{emailError}</p>
          )}

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={customer.phone}
            onChange={handleChange}
            required
            maxLength={10}
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none"
          />
          {phoneError && (
            <p className="text-red-500 text-xs -mt-2">{phoneError}</p>
          )}

          <textarea
            name="billingAddress"
            placeholder="Billing Address"
            value={customer.billingAddress}
            onChange={handleChange}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none"
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
            className={`w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none ${
              sameAsBilling ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />

          {/* ✅ Info Box */}
          <div className="text-sm text-[#5f4d2d] bg-[#fff7e3] p-3 rounded border border-[#f3e4b5]">
            <p>✔ Safe and secure PhonePe payments</p>
            <p>✔ Easy returns</p>
            <p>✔ 100% Authentic products</p>
          </div>

          {/* ✅ Pay Button */}
          <button
            type="submit"
            disabled={isProcessing || !isFormValid}
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "🛍️ Pay with PhonePe"}
          </button>
        </form>
      )}
      </div>
    </CartAuthGuard>
  );
};

export default CheckoutPage;
