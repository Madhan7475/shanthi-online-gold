import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  LogOut,
} from "lucide-react";

const Panel = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#400F45] border-r-4 border-[#fff2a6] p-6 hidden md:block shadow-xl rounded-tr-2xl rounded-br-2xl">
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.svg"
            alt="Admin Logo"
            className="h-12 w-auto object-contain"
          />
        </div>
        <nav className="space-y-10 text-gray-200">
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
          <div>
            <h2 className="text-2xl font-bold text-[#400F45]">Admin Dashboard</h2>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

// Sidebar Navigation Link
const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-white hover:text-[#f599ff] transition-all"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Panel;
