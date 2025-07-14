import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, Package, ShoppingCart, Users, FileText,
  Lock, Search, LogOut
} from "lucide-react";

const Panel = () => {
  const navigate = useNavigate();

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
          <NavItem to="/admin/tools" icon={<Search size={18} />} label="Search & Notifications" />
          <NavItem to="/admin/settings" icon={<Lock size={18} />} label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#400F45]">Sales Dashboard</h2>
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

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Widget title="Sales Growth" subtitle="INR 89,236" percentage="82%" />
          <StatCard title="Income" amount="INR 27,632" growth="+2.5%" />
          <StatCard title="Expenses" amount="INR 14,320" growth="-1.2%" />
        </div>

        {/* Bottom Section (Only SalesChart now) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <SalesChart />
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-[#ffffff] hover:text-[#f599ff] transition-all"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const Widget = ({ title, subtitle, percentage }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <p className="text-sm text-gray-500">{title}</p>
    <h3 className="text-2xl font-bold mb-2">{subtitle}</h3>
    <div className="w-20 h-20 relative">
      <div className="absolute inset-0 rounded-full border-8 border-[#400F45]" />
      <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-[#400F45]">
        {percentage}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, amount, growth }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h4 className="text-sm text-gray-500">{title}</h4>
    <p className="text-2xl font-bold text-[#400F45]">{amount}</p>
    <p className={`text-sm mt-1 ${growth.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
      {growth} {growth.startsWith('-') ? '↓' : '↑'}
    </p>
  </div>
);

const SalesChart = () => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h4 className="text-md font-bold mb-4 text-[#400F45]">Product Sales</h4>
    <div className="h-60 flex items-center justify-center text-gray-400">
      [Chart Placeholder]
    </div>
  </div>
);

export default Panel;
