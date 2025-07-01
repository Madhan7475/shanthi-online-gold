import { useEffect, useState } from "react";
import axios from "axios";

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL/api/orders}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div className="p-6 bg-[#f9f6f0] min-h-screen text-[#3b004c]">
      <h1 className="text-2xl font-bold text-[#3b004c] mb-6">Order Management</h1>

      <div className="overflow-x-auto rounded-xl shadow">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#3b004c] text-white">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Total (₹)</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {orders.map((order) => (
              <tr key={order._id} className="border-t hover:bg-[#f3e5ff]">
                <td className="p-3 font-mono text-xs">{order._id.slice(-6)}</td>
                <td className="p-3">{order.customerName || "N/A"}</td>
                <td className="p-3">₹{order.total}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => handleStatusChange(order._id, "Shipped")}
                    className="text-white bg-[#8b1d92] px-3 py-1 rounded hover:bg-[#a43caa]"
                  >
                    Ship
                  </button>
                  <button
                    onClick={() => handleStatusChange(order._id, "Delivered")}
                    className="text-white bg-[#5b166b] px-3 py-1 rounded hover:bg-[#7b2e8f]"
                  >
                    Deliver
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Shipped":
      return "bg-blue-100 text-blue-700";
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

export default AdminOrderList;
