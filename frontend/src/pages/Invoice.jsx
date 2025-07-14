import React, { useEffect, useState } from "react";
import { BarChart3, FileText, Lock, LogOut, Package, Search, ShoppingCart, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Sidebar nav item
const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-white hover:text-[#f599ff] transition-all"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const Invoice = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/invoices`);
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      }
    };

    fetchInvoices();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#400F45] border-r-4 border-[#fff2a6] p-6 hidden md:block shadow-xl rounded-tr-2xl rounded-br-2xl">
        <h1 className="text-2xl font-bold mb-8 flex justify-center">
          <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
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
      <main className="flex-1 p-6 bg-gray-50">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#400F45]">Invoices</h2>
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

        {/* Invoice Table */}
        <div className="bg-white border border-[#d1bfd9] rounded-2xl shadow-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#400F45] text-white">
              <tr>
                <th className="p-4 text-left">Invoice ID</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="border-t hover:bg-[#f5ecff]">
                    <td className="p-4 font-mono text-xs">{invoice._id.slice(-6)}</td>
                    <td className="p-4">{invoice.customerName || "N/A"}</td>
                    <td className="p-4">₹{invoice.amount}</td>
                    <td className="p-4">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="bg-[#400F45] text-white px-3 py-1 rounded hover:bg-[#300c36] text-xs">
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No invoices available.
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
    case "Paid":
      return "bg-green-100 text-green-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

export default Invoice;
