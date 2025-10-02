import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Layout from "../components/Common/Layout";
import { toast } from "react-toastify";
import { phonePeService } from "../services/phonepeService";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryIntervalRef = useRef(null);

  useEffect(() => {
    // Function to check payment status using PhonePe service (moved inside useEffect)
    const checkPaymentStatus = async (orderData) => {
      try {
        setPaymentStatusLoading(true);

        // Use transactionId from order if available, otherwise use orderId
        const checkId = orderData._id;
        console.log(`Checking payment status for: ${checkId}`);

        const response = await phonePeService.checkPaymentStatus(checkId);
        console.log("Payment status response:", response);

        setPaymentStatus(response);

        // If payment is successful or failed, stop retrying
        if (response.state === 'COMPLETED' || response.state === 'FAILED') {
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
          }

          // Update order status if payment is completed
          if (response.state === 'COMPLETED' && orderData.status?.toLowerCase() === 'pending') {
            setOrder(prev => ({ ...prev, status: 'Processing' }));
            toast.success("Payment completed! Order status updated.");
          } else if (response.state === 'FAILED') {
            toast.error("Payment failed. Please try again or contact support.");
          }
        }

        return response;
      } catch (error) {
        console.error("Failed to check payment status:", error);
        toast.error("Could not check payment status.");
        return null;
      } finally {
        setPaymentStatusLoading(false);
      }
    };

    const fetchOrder = async () => {
      try {
        const { data } = await axiosInstance.get(`/orders/${orderId}`);
        setOrder(data);

        // Start payment status checking after order is loaded
        if (data.paymentMethod !== 'cod') {
          // Clear any existing interval
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
          }

          // Check immediately (first call)
          checkPaymentStatus(data);

          // Set up retry mechanism - retry every 30 seconds for 3 times
          let attempts = 0;
          const maxRetries = 3;

          retryIntervalRef.current = setInterval(async () => {
            attempts++;
            setRetryCount(attempts);

            console.log(`Payment status check attempt ${attempts}/${maxRetries}`);

            const result = await checkPaymentStatus(data);

            // Stop retrying if:
            // 1. Max retries reached
            // 2. Payment is completed, failed, or cancelled
            // 3. No result returned (error occurred)
            if (
              attempts >= maxRetries ||
              !result ||
              result.state === 'COMPLETED' ||
              result.state === 'FAILED'
            ) {
              clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;

              if (attempts >= maxRetries && result?.state === 'PENDING') {
                toast.info("Payment is still pending. Please refresh the page later to check status.");
              }
            }
          }, 30000); // 30 seconds
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        toast.error("Could not load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Cleanup interval on component unmount
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [orderId]); // Only depend on orderId

  // Manual refresh function for payment status
  const manualCheckPaymentStatus = React.useCallback(async () => {
    if (!order) return;

    try {
      setPaymentStatusLoading(true);

      const checkId = order._id;
      const response = await phonePeService.checkPaymentStatus(checkId);

      setPaymentStatus(response);

      if (response.state === 'COMPLETED' && order.status?.toLowerCase() === 'pending') {
        setOrder(prev => ({ ...prev, status: 'Processing' }));
        toast.success("Payment completed! Order status updated.");
      } else if (response.state === 'FAILED') {
        toast.error("Payment failed. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
      toast.error("Could not check payment status.");
    } finally {
      setPaymentStatusLoading(false);
    }
  }, [order]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Paid":
        return "text-yellow-600 bg-yellow-100";
      case "Shipped":
        return "text-blue-600 bg-blue-100";
      case "Delivered":
        return "text-green-600 bg-green-100";
      case "Cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">Loading Order Details...</div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-20">Order not found.</div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold text-[#3e2f1c] mb-4">Order Details</h2>

        {/* Items List */}
        <div className="border-t border-[#f4e0b9] pt-4">
          <h3 className="font-semibold text-[#3e2f1c] mb-2">Order Summary</h3>
          {order.items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 py-3 text-sm border-b border-gray-100 last:border-b-0"
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${item.image}`}
                alt={item.title}
                className="w-16 h-16 object-contain rounded border border-[#f4e0b9]"
              />
              <div className="flex-grow">
                <p className="font-semibold text-[#3e2f1c]">{item.title}</p>
                <p className="text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">
                ₹{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="text-right mt-4">
            <p className="text-lg font-bold text-[#c29d5f]">
              Total: ₹{order.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
