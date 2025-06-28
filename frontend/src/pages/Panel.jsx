import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Lock,
  Bell,
  Search
} from "lucide-react";

const Panel = () => {
  return (
    <div className="flex min-h-screen text-[#f7c974] bg-[#3b004c]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#24002f] border-r border-[#4a1554] p-6 hidden md:block shadow-lg">
        <h1 className="text-2xl font-bold mb-8 text-[#f7c974]">Admin Panel</h1>
        <nav className="space-y-5">
          <NavItem to="/admin/products" icon={<Package size={18} />} label="Products" />
          <NavItem to="/admin/analytics" icon={<BarChart3 size={18} />} label="Sales Analytics" />
          <NavItem to="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
          <NavItem to="/admin/profiles" icon={<Users size={18} />} label="Profiles" />
          <NavItem to="/admin/invoices" icon={<FileText size={18} />} label="Invoices" />
          <NavItem to="/admin/auth" icon={<Lock size={18} />} label="Auth / Login" />
          <NavItem to="/admin/tools" icon={<Search size={18} />} label="Search & Notifications" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#f8f8f8]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#4a1554]">Dashboard Overview</h2>
          <div className="text-sm text-[#d6a15c] hidden sm:block">
            Safe & Secure • Easy Returns • 100% Authentic
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard title="Products" to="/admin/products" icon={<Package />} />
          <DashboardCard title="Sales Analytics" to="/admin/analytics" icon={<BarChart3 />} />
          <DashboardCard title="Orders" to="/admin/orders" icon={<ShoppingCart />} />
          <DashboardCard title="Profiles" to="/admin/profiles" icon={<Users />} />
          <DashboardCard title="Invoices" to="/admin/invoices" icon={<FileText />} />
          <DashboardCard title="Auth / Login" to="/admin/auth" icon={<Lock />} />
          <DashboardCard title="Search & Notifications" to="/admin/tools" icon={<Bell />} />
        </div>
      </main>
    </div>
  );
};

// Sidebar Nav Item
const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 text-[#f7c974] hover:text-white transition-all duration-150"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

// Dashboard Card
const DashboardCard = ({ title, to, icon }) => (
  <Link
    to={to}
    className="bg-[#fff] p-6 rounded-xl shadow-md border border-[#f0dbb4] hover:shadow-lg transition-all flex items-center space-x-4"
  >
    <div className="text-[#c29d5f]">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-[#3b004c]">{title}</h3>
      <p className="text-sm text-[#735044]">Manage {title.toLowerCase()}</p>
    </div>
  </Link>
);

export default Panel;
