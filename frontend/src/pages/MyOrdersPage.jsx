import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Common/Layout";
import { toast } from "react-toastify";
import Pagination from "../components/Common/Pagination";

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        let cancelled = false;
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get("/orders/my-orders", {
                    params: { page: currentPage, limit: pageSize },
                });
                if (cancelled) return;
                const items = data.items || data;
                setOrders(Array.isArray(items) ? items : []);
                const pages =
                    Number(data.pages) ||
                    Math.max(
                        1,
                        Math.ceil(
                            (Array.isArray(data) ? data.length : Number(data.total || 0)) / pageSize
                        )
                    );
                setTotalPages(pages);
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch orders:", error);
                    toast.error("Could not load your orders.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        if (user) {
            fetchOrders();
        }
        return () => {
            cancelled = true;
        };
    }, [user, currentPage, pageSize]);

    // Responsive page size: 3 (mobile), 4 (tablet), 5 (desktop)
    useEffect(() => {
        const compute = () => {
            if (window.matchMedia("(max-width: 640px)").matches) return 3;
            if (window.matchMedia("(max-width: 1024px)").matches) return 4;
            return 5;
        };
        const update = () => {
            setPageSize(compute());
            setCurrentPage(1);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Clamp current page when data or page size changes
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    // const handleCancelOrder = async (e, orderId) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     if (window.confirm("Are you sure you want to cancel this order?")) {
    //         try {
    //             const { data: updatedOrder } = await axiosInstance.put(`/orders/${orderId}/cancel`);
    //             setOrders(prevOrders =>
    //                 prevOrders.map(order =>
    //                     order._id === orderId ? updatedOrder : order
    //                 )
    //             );
    //             toast.success("Order successfully cancelled.");
    //         } catch (error) {
    //             toast.error(error.response?.data?.msg || "Failed to cancel order.");
    //         }
    //     }
    // };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending": return "text-yellow-600 bg-yellow-100";
            case "Shipped": return "text-blue-600 bg-blue-100";
            case "Delivered": return "text-green-600 bg-green-100";
            case "Cancelled": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const visibleOrders = Array.isArray(orders) ? orders.slice(0, pageSize) : [];

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
                    {visibleOrders.map(order => (
                        <Link
                            to={`/order/${order._id}`}
                            key={order._id}
                            className="block hover:shadow-lg transition-shadow rounded-xl"
                        >
                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#f4e0b9] shadow-md">
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
                                    {(order.items || []).slice(0, 1).map(item => (
                                        <div key={item._id} className="flex items-center gap-4 py-2 text-sm">
                                            <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${item.image}`} alt={item.title} className="w-12 h-12 object-contain rounded border border-[#f4e0b9]" />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-[#3e2f1c]">{item.title}</p>
                                                <p className="text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                    {Array.isArray(order.items) && order.items.length > 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            +{order.items.length - 1} more item{order.items.length - 1 > 1 ? "s" : ""}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-[#f4e0b9] pt-3 mt-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="text-lg font-bold text-[#c29d5f]">Total: ₹{order.total.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Payment: {order.paymentMethod === 'phonepe' ? 'PhonePe' : order.paymentMethod}
                                                {order.transactionId && <span className="ml-2 font-mono">#{order.transactionId.slice(-8)}</span>}
                                            </p>
                                        </div>
                                        {order.status === 'Pending' && (
                                            <button
                                                onClick={e => handleCancelOrder(e, order._id)}
                                                className="mt-2 sm:mt-0 w-full sm:w-auto bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition text-sm font-semibold"
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {orders.length > 0 && totalPages > 1 && (
                <div className="pt-6">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;
