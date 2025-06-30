// src/pages/AdminAnalytics.jsx
import React from "react";
import { BarChart3, Activity, ShoppingCart, DollarSign, Users } from "lucide-react";

const AdminAnalytics = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-800">📊 Sales Analytics</h1>
        <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
          👤 Logged in as Admin
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white shadow-md p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Orders</p>
            <h2 className="text-xl font-bold text-gray-800">1,248</h2>
          </div>
          <ShoppingCart className="text-purple-700 w-6 h-6" />
        </div>

        <div className="bg-white shadow-md p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h2 className="text-xl font-bold text-gray-800">₹5,23,400</h2>
          </div>
          <DollarSign className="text-purple-700 w-6 h-6" />
        </div>

        <div className="bg-white shadow-md p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Orders</p>
            <h2 className="text-xl font-bold text-gray-800">67</h2>
          </div>
          <Activity className="text-purple-700 w-6 h-6" />
        </div>

        <div className="bg-white shadow-md p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Registered Users</p>
            <h2 className="text-xl font-bold text-gray-800">3,782</h2>
          </div>
          <Users className="text-purple-700 w-6 h-6" />
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" /> Monthly Revenue
          </h3>
          <span className="text-sm text-gray-400">Live updating...</span>
        </div>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm italic">
          [Chart Placeholder - integrate Recharts or Chart.js]
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
