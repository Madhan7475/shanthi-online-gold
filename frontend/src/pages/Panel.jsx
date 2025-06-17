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
    <div className="flex min-h-screen text-[#3e2f1c] bg-[#fdfaf2]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#fff] border-r border-[#f4e0b9] p-6 hidden md:block">
        <h1 className="text-2xl font-bold mb-8 text-[#d4af37]">Admin Panel</h1>
        <nav className="space-y-4">
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
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#d4af37]">Dashboard Overview</h2>
          <div className="text-sm text-[#7e704c] hidden sm:block">
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

// Sidebar nav item
const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-2 text-[#3e2f1c] hover:text-[#d4af37] transition"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

// Dashboard grid card
const DashboardCard = ({ title, to, icon }) => (
  <Link
    to={to}
    className="bg-white border border-[#f4e0b9] p-6 rounded-xl shadow hover:shadow-lg transition flex items-center space-x-4"
  >
    <div className="text-[#c29d5f]">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-[#8a7653]">Manage {title.toLowerCase()}</p>
    </div>
  </Link>
);

export default Panel;
