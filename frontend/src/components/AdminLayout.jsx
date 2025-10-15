import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Users, LogOut, Coins } from "lucide-react";

const AdminLayout = ({ children }) => {
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
          <NavItem to="/admin/products" icon={<Package size={18} />} label="Products" />
          <NavItem to="/admin/market" icon={<Coins size={18} />} label="Gold Rate" />
          <NavItem to="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
          <NavItem to="/admin/profiles" icon={<Users size={18} />} label="Profile Management" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Topbar */}
        <div className="flex justify-end items-center mb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Content Area */}
        <div className="h-full">
          {children}
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

export default AdminLayout;
