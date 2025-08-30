import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Layout from "../components/Common/Layout";
import { toast } from "react-toastify";

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending": case "Paid": return "text-yellow-600 bg-yellow-100";
            case "Shipped": return "text-blue-600 bg-blue-100";
            case "Delivered": return "text-green-600 bg-green-100";
            case "Cancelled": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    if (loading) {
        return <Layout><div className="text-center py-20">Loading Order Details...</div></Layout>;
    }

    if (!order) {
        return <Layout><div className="text-center py-20">Order not found.</div></Layout>;
    }

    return (

        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-[#fffdf6]">
            <Link to="/my-orders" className="text-sm text-[#9e886e] underline mb-4 inline-block hover:text-[#b19874]">
                ← Back to My Orders
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#d4af37]">Order Details</h1>

            <div className="bg-white p-6 rounded-xl border border-[#f4e0b9] shadow-md">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#f4e0b9] pb-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Order placed on</p>
                        {/* ✅ FIX: Changed to toLocaleString() to include time */}
                        <p className="font-semibold text-gray-800">{new Date(order.date).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-semibold text-gray-800 font-mono">{order._id}</p>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1 rounded-full mt-2 sm:mt-0 ${getStatusColor(order.status)}`}>
                        {order.status}
                    </div>
                </div>

                {/* Address and Payment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <h3 className="font-semibold text-[#3e2f1c] mb-2">Shipping Address</h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.deliveryAddress}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#3e2f1c] mb-2">Payment Method</h3>
                        <p className="text-sm text-gray-600 capitalize">{order.paymentMethod.replace('cod', 'Cash on Delivery')}</p>
                    </div>
                </div>

                {/* Items List */}
                <div className="border-t border-[#f4e0b9] pt-4">
                    <h3 className="font-semibold text-[#3e2f1c] mb-2">Order Summary</h3>
                    {order.items.map(item => (
                        <div key={item._id} className="flex items-center gap-4 py-3 text-sm border-b border-gray-100 last:border-b-0">
                            <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${item.images[0]}`} alt={item.title} className="w-16 h-16 object-contain rounded border border-[#f4e0b9]" />
                            <div className="flex-grow">
                                <p className="font-semibold text-[#3e2f1c]">{item.title}</p>
                                <p className="text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                    ))}
                    <div className="text-right mt-4">
                        <p className="text-lg font-bold text-[#c29d5f]">Total: ₹{order.total.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
