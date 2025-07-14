import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, Package, ShoppingCart, Users, FileText,
  Lock, Search, LogOut
} from "lucide-react";
import axios from "axios";

const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-[#ffffff] hover:text-[#f599ff] transition-all"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const AdminOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders`);
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`, {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#400F45] border-r-4 border-[#fff2a6] p-6 hidden md:block shadow-xl rounded-tr-2xl rounded-br-2xl">
        <h1 className="text-2xl font-bold mb-8 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Your Logo"
            className="h-12 w-auto object-contain inline-block"
          />
        </h1>
        <nav className="space-y-10 text-gray-200">
          <NavItem to="/admin/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/admin/products" icon={<Package size={18} />} label="Products" />
          <NavItem to="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
          <NavItem to="/admin/profiles" icon={<Users size={18} />} label="Profiles" />
          <NavItem to="/admin/invoices" icon={<FileText size={18} />} label="Invoices" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#400F45]">Order Management</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            />
            <button className="bg-[#400F45] text-white px-4 py-2 rounded-md">+</button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto bg-white rounded-xl border border-[#d1bfd9] shadow">
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
              {orders.length > 0 ? (
                orders.map((order) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
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
