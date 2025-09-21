import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, Download, Eye, FileDown, X, MapPin, Phone, Mail,
    CreditCard, Clock, Package, ShoppingCart, Users, RefreshCw,
    TrendingUp, DollarSign, Calendar, BarChart3
} from "lucide-react";

const AdminOrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("All");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderStats, setOrderStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        todayRevenue: 0,
        weeklyRevenue: 0
    });

    // Fetch orders from API
    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 2 minutes
        const interval = setInterval(fetchOrders, 120000);
        return () => clearInterval(interval);
    }, []);

    // Filter and search orders
    useEffect(() => {
        let filtered = orders;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
                (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply status filter
        if (statusFilter !== "All") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Apply date filter
        if (dateFilter !== "All") {
            const now = new Date();
            const filterDate = new Date();

            switch (dateFilter) {
                case "Today":
                    filterDate.setDate(now.getDate());
                    break;
                case "Week":
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case "Month":
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                default:
                    filterDate.setTime(0);
            }

            filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
        }

        // Apply sorting
        filtered = filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case "date":
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case "amount":
                    aValue = parseFloat(a.totalAmount);
                    bValue = parseFloat(b.totalAmount);
                    break;
                case "status":
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case "customer":
                    aValue = a.customerName;
                    bValue = b.customerName;
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (sortOrder === "desc") {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        setFilteredOrders(filtered);
        setCurrentPage(1);
    }, [orders, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            
            const response = await fetch("/api/orders", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            
            // Transform data to ensure consistent structure
            const transformedOrders = data.map(order => ({
                ...order,
                orderId: order.orderId || order._id,
                customerName: order.customerName || order.customer?.name || 'N/A',
                customerEmail: order.customerEmail || order.customer?.email || 'N/A',
                customerPhone: order.customerPhone || order.customer?.phone || 'N/A',
                totalAmount: order.totalAmount || order.total || 0,
                paymentMethod: order.paymentMethod || 'COD',
                paymentStatus: order.paymentStatus || (order.paymentMethod === 'COD' ? 'Pending' : 'Paid'),
                status: order.status || 'Pending',
                products: order.products || order.items || [],
                shippingAddress: order.shippingAddress || order.address || null
            }));

            setOrders(transformedOrders);
            calculateStats(transformedOrders);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ordersList) => {
        const stats = {
            total: ordersList.length,
            pending: ordersList.filter(o => o.status === 'Pending').length,
            processing: ordersList.filter(o => o.status === 'Processing').length,
            shipped: ordersList.filter(o => o.status === 'Shipped').length,
            delivered: ordersList.filter(o => o.status === 'Delivered').length,
            cancelled: ordersList.filter(o => o.status === 'Cancelled').length,
            todayRevenue: 0,
            weeklyRevenue: 0
        };

        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        stats.todayRevenue = ordersList
            .filter(o => new Date(o.createdAt).toDateString() === today.toDateString())
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        stats.weeklyRevenue = ordersList
            .filter(o => new Date(o.createdAt) >= weekAgo)
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        setOrderStats(stats);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem("adminToken");
            
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            // Refresh orders list
            fetchOrders();
            
            // Update selected order if it's the one being viewed
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const generateInvoice = (order) => {
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Invoice - ${order.orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #400F45; padding-bottom: 20px; margin-bottom: 30px; }
                    .company-name { color: #400F45; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                    .invoice-title { font-size: 24px; color: #333; margin: 20px 0; }
                    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .invoice-info, .customer-info { width: 45%; }
                    .label { font-weight: bold; color: #400F45; }
                    .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .products-table th, .products-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .products-table th { background-color: #400F45; color: white; }
                    .total-section { text-align: right; margin-top: 30px; }
                    .total-amount { font-size: 20px; font-weight: bold; color: #400F45; }
                    .footer { margin-top: 40px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Shanthi Online Gold</div>
                    <p>Premium Gold Jewelry & Ornaments</p>
                </div>

                <h2 class="invoice-title">INVOICE</h2>

                <div class="invoice-details">
                    <div class="invoice-info">
                        <p><span class="label">Invoice No:</span> ${order.orderId}</p>
                        <p><span class="label">Date:</span> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        <p><span class="label">Status:</span> ${order.status}</p>
                        <p><span class="label">Payment:</span> ${order.paymentMethod} - ${order.paymentStatus}</p>
                    </div>
                    <div class="customer-info">
                        <p><span class="label">Customer:</span> ${order.customerName}</p>
                        <p><span class="label">Email:</span> ${order.customerEmail}</p>
                        <p><span class="label">Phone:</span> ${order.customerPhone}</p>
                        ${order.shippingAddress ? `
                            <p><span class="label">Address:</span><br>
                            ${order.shippingAddress.street}<br>
                            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                            PIN: ${order.shippingAddress.pincode}</p>
                        ` : ''}
                    </div>
                </div>

                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.products && order.products.length > 0 ? 
                            order.products.map(product => `
                                <tr>
                                    <td>${product.name || 'Gold Jewelry Item'}</td>
                                    <td>${product.quantity || 1}</td>
                                    <td>₹${parseFloat(product.price || order.totalAmount).toLocaleString('en-IN')}</td>
                                    <td>₹${parseFloat((product.price || order.totalAmount) * (product.quantity || 1)).toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')
                            : `
                                <tr>
                                    <td>Gold Jewelry Order</td>
                                    <td>1</td>
                                    <td>₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
                                    <td>₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
                                </tr>
                            `
                        }
                    </tbody>
                </table>

                <div class="total-section">
                    <p class="total-amount">Total Amount: ₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}</p>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>For any queries, contact us at info@shanthionlinegold.com</p>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([invoiceHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.orderId}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkExport = () => {
        const csvContent = [
            ['Order ID', 'Customer', 'Email', 'Phone', 'Amount', 'Status', 'Payment Method', 'Date'].join(','),
            ...filteredOrders.map(order => [
                order.orderId,
                `"${order.customerName}"`,
                order.customerEmail,
                order.customerPhone,
                order.totalAmount,
                order.status,
                order.paymentMethod,
                new Date(order.createdAt).toLocaleDateString('en-IN')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Processing': return 'bg-blue-100 text-blue-800';
            case 'Shipped': return 'bg-purple-100 text-purple-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusActions = (order) => {
        const actions = [];
        
        switch (order.status) {
            case 'Pending':
                actions.push(
                    <button
                        key="process"
                        onClick={() => updateOrderStatus(order._id, 'Processing')}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition"
                    >
                        Mark Processing
                    </button>
                );
                break;
            case 'Processing':
                actions.push(
                    <button
                        key="ship"
                        onClick={() => updateOrderStatus(order._id, 'Shipped')}
                        className="bg-purple-500 text-white px-3 py-1 rounded-md text-xs hover:bg-purple-600 transition"
                    >
                        Mark Shipped
                    </button>
                );
                break;
            case 'Shipped':
                actions.push(
                    <button
                        key="deliver"
                        onClick={() => updateOrderStatus(order._id, 'Delivered')}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition"
                    >
                        Mark Delivered
                    </button>
                );
                break;
        }

        if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
            actions.push(
                <button
                    key="cancel"
                    onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition"
                >
                    Cancel
                </button>
            );
        }

        return actions;
    };

    // Pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <ShoppingCart size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <Clock size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Package size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Delivered</p>
                            <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-[#400F45] text-white">
                            <TrendingUp size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{orderStats.todayRevenue.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-md">
                <div>
                    <h1 className="text-2xl font-bold text-[#400F45]">Order Management</h1>
                    <p className="text-gray-600 text-sm">
                        Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45]"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45]"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45]"
                    >
                        <option value="All">All Time</option>
                        <option value="Today">Today</option>
                        <option value="Week">This Week</option>
                        <option value="Month">This Month</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45]"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="amount">Sort by Amount</option>
                        <option value="status">Sort by Status</option>
                        <option value="customer">Sort by Customer</option>
                    </select>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                        >
                            {sortOrder === "asc" ? "↑" : "↓"}
                        </button>
                        <button
                            onClick={handleBulkExport}
                            className="flex items-center gap-2 px-4 py-2 bg-[#400F45] text-white rounded-lg hover:bg-[#5a1762] transition"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#400F45]"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#400F45] text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Order Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentOrders.length > 0 ? (
                                    currentOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{order.orderId || order._id.slice(-8)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.products?.[0]?.name || 'Product details'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.customerName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.customerEmail}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.customerPhone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    ₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.paymentMethod}</div>
                                                <div className={`text-xs ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {order.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2 flex-wrap">
                                                    {getStatusActions(order)}
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="bg-gray-500 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-600 transition"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => generateInvoice(order)}
                                                        className="bg-[#400F45] text-white px-3 py-1 rounded-md text-xs hover:bg-[#5a1762] transition"
                                                    >
                                                        <FileDown size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="text-gray-500">
                                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                <p className="text-lg font-medium">No orders found</p>
                                                <p className="text-sm">No orders match your current filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-6 py-4 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-md transition ${
                                        currentPage === page
                                            ? 'bg-[#400F45] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#400F45]">
                                    Order Details - #{selectedOrder.orderId}
                                </h2>
                                <button
                                    onClick={() => setShowOrderModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                                        <Users className="mr-2" size={20} />
                                        Customer Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                                        <p className="flex items-center">
                                            <Mail className="mr-2" size={16} />
                                            <span className="font-medium">Email:</span> {selectedOrder.customerEmail}
                                        </p>
                                        <p className="flex items-center">
                                            <Phone className="mr-2" size={16} />
                                            <span className="font-medium">Phone:</span> {selectedOrder.customerPhone}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                                        <Package className="mr-2" size={20} />
                                        Order Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Status:</span> 
                                            <span className={`ml-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </p>
                                        <p className="flex items-center">
                                            <CreditCard className="mr-2" size={16} />
                                            <span className="font-medium">Payment:</span> {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                                        </p>
                                        <p className="flex items-center">
                                            <DollarSign className="mr-2" size={16} />
                                            <span className="font-medium">Total:</span> ₹{parseFloat(selectedOrder.totalAmount).toLocaleString('en-IN')}
                                        </p>
                                        <p className="flex items-center">
                                            <Calendar className="mr-2" size={16} />
                                            <span className="font-medium">Ordered:</span> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                                    <ShoppingCart className="mr-2" size={20} />
                                    Products
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.products && selectedOrder.products.length > 0 ? (
                                        selectedOrder.products.map((product, index) => (
                                            <div key={index} className="bg-white p-3 rounded-lg border">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                                                        <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600">No products found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderList;
