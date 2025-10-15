import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { phonePeService } from "../services/phonepeService";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryIntervalRef = useRef(null);

  useEffect(() => {
    const checkPaymentStatus = async (orderData) => {
      try {
        setPaymentStatusLoading(true);

        const checkId = orderData._id;
        console.log(`Checking payment status for: ${checkId}`);

        const response = await phonePeService.checkPaymentStatus(checkId);
        console.log("Payment status response:", response);

        setPaymentStatus(response);

        if (response.state === "COMPLETED" || response.state === "FAILED") {
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
          }

          if (
            response.state === "COMPLETED" &&
            orderData.status?.toLowerCase() === "pending"
          ) {
            setOrder((prev) => ({ ...prev, status: "Processing" }));
            toast.success("Payment completed! Order status updated.");
          } else if (response.state === "FAILED") {
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

        if (data.paymentMethod !== "cod") {
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
          }

          checkPaymentStatus(data);

          let attempts = 0;
          const maxRetries = 3;

          retryIntervalRef.current = setInterval(async () => {
            attempts++;
            setRetryCount(attempts);

            console.log(`Payment status check attempt ${attempts}/${maxRetries}`);

            const result = await checkPaymentStatus(data);

            if (
              attempts >= maxRetries ||
              !result ||
              result.state === "COMPLETED" ||
              result.state === "FAILED"
            ) {
              clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;

              if (attempts >= maxRetries && result?.state === "PENDING") {
                toast.info(
                  "Payment is still pending. Please refresh the page later to check status."
                );
              }
            }
          }, 30000);
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        toast.error("Could not load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [orderId]);

  const manualCheckPaymentStatus = React.useCallback(async () => {
    if (!order) return;

    try {
      setPaymentStatusLoading(true);

      const checkId = order._id;
      const response = await phonePeService.checkPaymentStatus(checkId);

      setPaymentStatus(response);

      if (response.state === "COMPLETED" && order.status?.toLowerCase() === "pending") {
        setOrder((prev) => ({ ...prev, status: "Processing" }));
        toast.success("Payment completed! Order status updated.");
      } else if (response.state === "FAILED") {
        toast.error("Payment failed. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
      toast.error("Could not check payment status.");
    } finally {
      setPaymentStatusLoading(false);
    }
  }, [order]);

  const downloadInvoice = async () => {
    if (!order?._id) return;
    try {
      setInvoiceLoading(true);
      // Use axiosInstance to include auth headers; request PDF as blob
      const res = await axiosInstance.get(`/invoices/${order._id}/pdf`, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice_${order._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded.");
    } catch (e) {
      console.error("Invoice download failed:", e);
      // Fallback: try to open in a new tab (may still require auth)
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const token = localStorage.getItem("token");
        const url = token
          ? `${base}/api/invoices/${order._id}/pdf?auth=${encodeURIComponent(token)}`
          : `${base}/api/invoices/${order._id}/pdf`;
        window.open(url, "_blank");
      } catch { }
      toast.error("Could not download invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

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

  // Currency formatter
  const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString()}`;

  // Date/time formatter
  const formatDateTime = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleString("en-IN");
    } catch {
      return "N/A";
    }
  };

  // Resolve item image (supports filename or url fields)
  const getImageSrc = (item) => {
    if (item?.image) {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      return `${base}/uploads/${item.image}`;
    }
    return item?.imageUrl || item?.imageUrls?.[0] || "";
  };

  if (loading) {
    return <div className="text-center py-20">Loading Order Details...</div>;
  }

  if (!order) {
    return <div className="text-center py-20">Order not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-[#3e2f1c] mb-6 tracking-tight">Order Details</h2>

      {/* Top summary */}
      <div className="bg-white border border-[#f4e0b9] rounded-lg p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Order ID</div>
            <div className="font-mono text-sm">{order._id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Placed on</div>
            <div className="text-sm">
              {new Date(order.date || order.createdAt).toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 ring-current ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              Updated: {formatDateTime(order.statusUpdatedAt || order.updatedAt || order.date)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payment</div>
            <div className="text-sm capitalize">{order.paymentMethod || "N/A"}</div>
          </div>
          {order.transactionId ? (
            <div className="min-w-0">
              <div className="text-sm text-gray-500">Transaction ID</div>
              <div className="text-xs font-mono break-all">{order.transactionId}</div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={downloadInvoice}
            disabled={invoiceLoading}
            className="inline-flex items-center gap-2 bg-[#400F45] text-white text-sm px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-60"
          >
            {invoiceLoading ? "Preparing..." : "Download Invoice (PDF)"}
          </button>
        </div>
      </div>

      {/* Customer and Address */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[#f4e0b9] rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-[#3e2f1c] mb-2">Customer</h3>
          <p className="text-sm">{order.customerName}</p>
        </div>
        <div className="bg-white border border-[#f4e0b9] rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-[#3e2f1c] mb-2">Delivery Address</h3>
          <p className="text-sm whitespace-pre-wrap">{order.deliveryAddress}</p>
        </div>
      </div>

      {/* Payment status */}
      <div className="bg-white border border-[#f4e0b9] rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#3e2f1c]">Payment Status</h3>
          <button
            onClick={manualCheckPaymentStatus}
            disabled={paymentStatusLoading}
            className="text-sm bg-[#400F45] text-white px-3 py-1 rounded disabled:opacity-60"
          >
            {paymentStatusLoading ? "Checking..." : "Refresh"}
          </button>
        </div>
        <div className="mt-2 text-sm">
          <div>State: {paymentStatus?.state || "N/A"}</div>
          {typeof retryCount === "number" ? (
            <div className="text-xs text-gray-500">Auto-check attempts: {retryCount}</div>
          ) : null}
          {paymentStatus?.message ? (
            <div className="text-xs text-gray-500">Message: {paymentStatus.message}</div>
          ) : null}
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white border border-[#f4e0b9] rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-[#3e2f1c] mb-2">Order Summary</h3>
        {order.items.map((item, i) => (
          <div
            key={item._id || item.id || item.sku || `${item.title}-${i}`}
            className="flex items-center gap-4 py-3 px-2 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-md"
          >
            <img
              src={getImageSrc(item)}
              alt={item.title}
              className="w-20 h-20 object-contain rounded-md border border-[#f4e0b9] bg-white"
            />
            <div className="flex-grow">
              <p className="font-semibold text-[#3e2f1c]">{item.title}</p>
              <p className="text-gray-500">Qty: {item.quantity}</p>
              <p className="text-gray-500">Unit: {formatCurrency(item.price)}</p>
              {item.karatage ? (
                <p className="text-gray-500">Karat: {item.karatage}</p>
              ) : null}
              {item.grossWeight ? (
                <p className="text-gray-500">Weight: {item.grossWeight}</p>
              ) : null}
              {item.metal ? (
                <p className="text-gray-500">Metal: {item.metal}</p>
              ) : null}
              {item.size ? (
                <p className="text-gray-500">Size: {item.size}</p>
              ) : null}
              {item.materialColour ? (
                <p className="text-gray-500">Color: {item.materialColour}</p>
              ) : null}
              {item.brand ? (
                <p className="text-gray-500">Brand: {item.brand}</p>
              ) : null}
              {item.collection ? (
                <p className="text-gray-500">Collection: {item.collection}</p>
              ) : null}
              {item.jewelleryType ? (
                <p className="text-gray-500">Type: {item.jewelleryType}</p>
              ) : null}
            </div>
            <p className="font-semibold">
              {formatCurrency((item.price || 0) * (item.quantity || 1))}
            </p>
          </div>
        ))}
        <div className="text-right mt-6 space-y-1 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            Subtotal:{" "}
            {formatCurrency(
              Array.isArray(order.items)
                ? order.items.reduce(
                  (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
                  0
                )
                : 0
            )}
          </p>
          <p className="text-lg font-bold text-[#c29d5f]">
            Total: {formatCurrency(order.total)}
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Purity Guaranteed */}
          <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-12 h-12 text-[#400F45]"
              fill="currentColor"
            >
              <path d="M12 2.25l8.485 3.03c.3.107.515.39.515.707V12c0 5.25-3.25 9.75-9 11.25C6.25 21.75 3 17.25 3 12V6c0-.317.215-.6.515-.707L12 2.25z" />
              <path d="M10.25 12.5l1.75 1.75 3.75-3.75" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-[#3e2f1c]">Purity Guaranteed</div>
              <div className="text-sm text-gray-600">on every online purchases</div>
            </div>
          </div>

          {/* Secure Delivery */}
          <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-12 h-12 text-[#400F45]"
              fill="currentColor"
            >
              <path d="M2.75 7.5h10.5v7.5H2.75z" />
              <path d="M13.25 7.5h4.25l3.75 3.75V15h-8V7.5z" />
              <circle cx="7" cy="17.75" r="2.25" />
              <circle cx="17" cy="17.75" r="2.25" />
            </svg>
            <div>
              <div className="text-lg font-semibold text-[#3e2f1c]">Secure Delivery</div>
              <div className="text-sm text-gray-600">by our trusted partners</div>
            </div>
          </div>

          {/* Easy & Secure Payments (PhonePe) */}
          <div className="flex items-center gap-4 bg-white border border-[#f4e0b9] rounded-lg p-5 shadow-sm">
            <svg
              role="img"
              aria-label="PhonePe payments"
              viewBox="0 0 24 24"
              className="w-12 h-12"
            >
              <circle cx="12" cy="12" r="11" fill="#5F259F" />
              <text
                x="12"
                y="12"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight="700"
                fill="#FFFFFF"
              >
                पे
              </text>
            </svg>
            <div>
              <div className="text-lg font-semibold text-[#3e2f1c]">Easy & Secure Payments</div>
              <div className="text-sm text-gray-600">backed by the trust of PhonePe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
