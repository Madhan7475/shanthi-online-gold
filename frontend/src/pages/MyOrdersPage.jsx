import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Common/Layout";
import { toast } from "react-toastify";

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axiosInstance.get("/orders/my-orders");
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders:", error);
                toast.error("Could not load your orders.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            try {
                const { data: updatedOrder } = await axiosInstance.put(`/orders/${orderId}/cancel`);
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order._id === orderId ? updatedOrder : order
                    )
                );
                toast.success("Order successfully cancelled.");
            } catch (error) {
                toast.error(error.response?.data?.msg || "Failed to cancel order.");
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending": return "text-yellow-600 bg-yellow-100";
            case "Shipped": return "text-blue-600 bg-blue-100";
            case "Delivered": return "text-green-600 bg-green-100";
            case "Cancelled": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    if (loading) {
        return <Layout><div className="text-center py-20">Loading your orders...</div></Layout>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-[#fffdf6] min-h-[80vh]">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-[#d4af37]">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500">You haven't placed any orders yet.</p>
                    <Link to="/" className="text-[#c29d5f] underline mt-2 inline-block">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white p-4 sm:p-6 rounded-xl border border-[#f4e0b9] shadow-md">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#f4e0b9] pb-3 mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">Order ID: <span className="font-mono">{order._id.slice(-8)}</span></p>
                                    <p className="text-sm text-gray-500">Placed on: {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div className={`text-sm font-bold px-3 py-1 rounded-full mt-2 sm:mt-0 ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </div>
                            </div>

                            <div className="mb-4">
                                {order.items.map(item => (
                                    <div key={item._id} className="flex items-center gap-4 py-2 text-sm">
                                        <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${item.images[0]}`} alt={item.title} className="w-12 h-12 object-contain rounded border border-[#f4e0b9]" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-[#3e2f1c]">{item.title}</p>
                                            <p className="text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#f4e0b9] pt-3 mt-3 flex flex-col sm:flex-row justify-between items-center">
                                <p className="text-lg font-bold text-[#c29d5f]">Total: ₹{order.total.toLocaleString()}</p>
                                {order.status === 'Pending' && (
                                    <button
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="mt-4 sm:mt-0 w-full sm:w-auto bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition text-sm font-semibold"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;
