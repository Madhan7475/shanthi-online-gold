import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("orderId"); // passed in redirect URL

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axiosInstance.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        toast.error("Could not load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg text-gray-600">Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          Could not fetch order details.
        </h2>
        <button
          onClick={() => navigate("/my-orders")}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-700"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-green-600 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been placed.
        </p>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
          <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
          <p>
            <span className="font-medium">Order ID:</span> {order._id}
          </p>
          <p>
            <span className="font-medium">Customer:</span> {order.customerName}
          </p>
          <p>
            <span className="font-medium">Total:</span> ₹{order.total}
          </p>
          <p>
            <span className="font-medium">Status:</span> {order.status}
          </p>
        </div>

        <button
          onClick={() => navigate("/my-orders")}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}
