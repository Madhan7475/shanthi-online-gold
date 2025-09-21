import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Package, ShoppingCart, Users, FileText,
  Search, LogOut, Filter, Download, Eye, Edit, Trash2,
  Calendar, DollarSign, TrendingUp, RefreshCw, FileDown,
  X, MapPin, Phone, Mail, CreditCard, Truck, Clock
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
    totalRevenue: 0,
    avgOrderValue: 0
  });

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchOrders, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      const rawOrders = Array.isArray(data) ? data : (data.orders || []);
      // Normalize backend orders to the shape expected by this UI
      const ordersData = rawOrders.map((o) => ({
        _id: o._id,
        orderId: o._id ? String(o._id).slice(-8).toUpperCase() : undefined,
        customerName: o.customerName || 'Customer',
        customerEmail: o.customerEmail || 'N/A',
        customerPhone: o.customerPhone || 'N/A',
        products: Array.isArray(o.items)
          ? o.items.map((it) => ({
              name: it.title || it.name || 'Item',
              quantity: it.quantity || 1,
              price: it.price || 0,
              description: it.description,
            }))
          : [],
        totalAmount: o.total ?? o.totalAmount ?? 0,
        status: o.status || 'Pending',
        paymentMethod: o.paymentMethod
          ? o.paymentMethod === 'phonepe'
            ? 'PhonePe'
            : o.paymentMethod
          : 'N/A',
        paymentStatus: o.transactionId ? 'Paid' : 'Pending',
        shippingAddress: o.deliveryAddress
          ? { street: o.deliveryAddress }
          : o.shippingAddress,
        createdAt: o.date || o.createdAt || new Date().toISOString(),
        updatedAt: o.updatedAt || o.date || new Date().toISOString(),
      }));
      
      setOrders(ordersData);
      calculateOrderStats(ordersData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Use only real data; on error, show zeroed stats and no orders
      setOrders([]);
      calculateOrderStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate demo orders for development
  const generateDemoOrders = () => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const customerNames = ['Arjun Sharma', 'Priya Patel', 'Rajesh Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anjali Gupta', 'Rohit Mehta', 'Kavya Nair'];
    const products = ['22K Gold Chain', '18K Diamond Ring', 'Gold Bangles Set', 'Temple Jewelry', 'Bridal Set', 'Gold Earrings', 'Pendant Set'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      _id: `ORD${String(Date.now() + i).slice(-8)}`,
      orderId: `SOG${String(1000 + i)}`,
      customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      customerEmail: `customer${i + 1}@example.com`,
      customerPhone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      products: [{
        name: products[Math.floor(Math.random() * products.length)],
        quantity: Math.floor(Math.random() * 3) + 1,
        price: Math.floor(Math.random() * 50000) + 10000
      }],
      totalAmount: Math.floor(Math.random() * 100000) + 15000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'UPI',
      paymentStatus: Math.random() > 0.2 ? 'Paid' : 'Pending',
      shippingAddress: {
        street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        city: ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'][Math.floor(Math.random() * 5)],
        state: 'Tamil Nadu',
        pincode: Math.floor(Math.random() * 90000) + 10000
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));
  };

  // Calculate order statistics
  const calculateOrderStats = (ordersData) => {
    const stats = ordersData.reduce((acc, order) => {
      acc.total += 1;
      acc[order.status.toLowerCase()] += 1;
      acc.totalRevenue += parseFloat(order.totalAmount || 0);
      return acc;
    }, {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    });

    stats.avgOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;
    setOrderStats(stats);
  };

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter !== "All") {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (dateFilter) {
          case "Today":
            return orderDate.toDateString() === now.toDateString();
          case "Week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case "Month":
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
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
        case "customer":
          aValue = a.customerName?.toLowerCase() || "";
          bValue = b.customerName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a._id;
          bValue = b._id;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
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

      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        )
      );
      
      // Show success message (you can replace with toast notification)
      alert(`Order status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  // Handle bulk actions
  const handleBulkExport = () => {
    const csvContent = [
      ['Order ID', 'Customer', 'Email', 'Phone', 'Amount', 'Status', 'Date', 'Payment Method'].join(','),
      ...filteredOrders.map(order => [
        order.orderId || order._id.slice(-8),
        order.customerName,
        order.customerEmail,
        order.customerPhone || 'N/A',
        order.totalAmount,
        order.status,
        new Date(order.createdAt).toLocaleDateString(),
        order.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Generate and download invoice
  const handleDownloadInvoice = (order) => {
    const invoiceHtml = generateInvoiceHTML(order);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 100);
    };
  };

  // Generate invoice HTML
  const generateInvoiceHTML = (order) => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    
    // Calculate totals
    const subtotal = parseFloat(order.totalAmount);
    const tax = subtotal * 0.03; // 3% GST for gold jewelry
    const total = subtotal + tax;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId || order._id.slice(-8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #fff; }
          .invoice { max-width: 800px; margin: 20px auto; padding: 40px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #400F45; padding-bottom: 20px; }
          .company-info h1 { color: #DAA520; font-size: 32px; font-weight: bold; }
          .company-info p { color: #666; margin: 5px 0; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { color: #400F45; font-size: 24px; margin-bottom: 10px; }
          .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .invoice-details div { display: inline-block; margin: 5px 15px 5px 0; }
          .billing-info { display: flex; justify-content: space-between; margin: 30px 0; }
          .billing-box { flex: 1; margin-right: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .billing-box:last-child { margin-right: 0; }
          .billing-box h3 { color: #400F45; margin-bottom: 10px; font-size: 16px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th, .items-table td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
          .items-table th { background: #400F45; color: white; font-weight: bold; }
          .items-table tr:hover { background: #f8f9fa; }
          .totals { margin-top: 30px; }
          .totals table { width: 300px; margin-left: auto; }
          .totals td { padding: 10px; border: none; }
          .totals .total-row { font-weight: bold; font-size: 18px; color: #400F45; border-top: 2px solid #400F45; }
          .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #ddd; text-align: center; color: #666; }
          .payment-info { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(218, 165, 32, 0.1); z-index: -1; pointer-events: none; }
          @media print {
            .invoice { margin: 0; padding: 20px; box-shadow: none; }
            body { background: #fff; }
            .watermark { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">SOG</div>
        <div class="invoice">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <img src="/logo.png" alt="SOG Logo" style="height: 60px; margin-right: 15px;" />
                <div>
                  <h1 style="margin: 0; color: #DAA520; font-size: 32px;">SHANTHI ONLINE GOLD</h1>
                  <p style="margin: 2px 0; color: #B8860B; font-size: 14px; font-style: italic;">LEGACY OF PURITY</p>
                </div>
              </div>
              <p>123 Gold Street, T. Nagar</p>
              <p>Chennai - 600017, Tamil Nadu</p>
              <p>Phone: +91 98765 43210</p>
              <p>Email: info@shanthionlinegold.com</p>
              <p>GST: 33ABCDE1234F1Z5</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <div><strong>Invoice #:</strong> INV-${order.orderId || order._id.slice(-8)}</div>
              <div><strong>Date:</strong> ${currentDate}</div>
              <div><strong>Due Date:</strong> ${dueDate}</div>
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="invoice-details">
            <div><strong>Order ID:</strong> ${order.orderId || order._id.slice(-8)}</div>
            <div><strong>Order Date:</strong> ${orderDate}</div>
            <div><strong>Payment Method:</strong> ${order.paymentMethod}</div>
            <div><strong>Payment Status:</strong> <span style="color: ${order.paymentStatus === 'Paid' ? '#28a745' : '#dc3545'}">${order.paymentStatus}</span></div>
            <div><strong>Order Status:</strong> <span style="color: #400F45">${order.status}</span></div>
          </div>

          <!-- Billing Information -->
          <div class="billing-info">
            <div class="billing-box">
              <h3>Bill To:</h3>
              <p><strong>${order.customerName}</strong></p>
              <p>${order.customerEmail}</p>
              <p>${order.customerPhone}</p>
              ${order.shippingAddress ? `
                <p>${order.shippingAddress.street}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
                <p>PIN: ${order.shippingAddress.pincode}</p>
              ` : ''}
            </div>
            <div class="billing-box">
              <h3>Ship To:</h3>
              ${order.shippingAddress ? `
                <p>${order.shippingAddress.street}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
                <p>PIN: ${order.shippingAddress.pincode}</p>
                <p>India</p>
              ` : `
                <p>Same as billing address</p>
              `}
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Unit Price (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${order.products && order.products.length > 0 ? 
                order.products.map(product => `
                  <tr>
                    <td>
                      <strong>${product.name || 'Gold Jewelry Item'}</strong>
                      <br><small style="color: #666;">${product.description || 'Premium quality gold jewelry'}</small>
                    </td>
                    <td>${product.quantity || 1}</td>
                    <td>₹${(product.price || subtotal).toLocaleString('en-IN')}</td>
                    <td>₹${((product.price || subtotal) * (product.quantity || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('') :
                `<tr>
                  <td>
                    <strong>Gold Jewelry Order</strong>
                    <br><small style="color: #666;">Premium quality gold jewelry items</small>
                  </td>
                  <td>1</td>
                  <td>₹${subtotal.toLocaleString('en-IN')}</td>
                  <td>₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>`
              }
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>GST (3%):</td>
                <td style="text-align: right;">₹${tax.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td style="text-align: right;">FREE</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL:</td>
                <td style="text-align: right;">₹${total.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Information -->
          <div class="payment-info">
            <h3 style="color: #400F45; margin-bottom: 10px;">Payment Information</h3>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            ${order.paymentStatus === 'Paid' ? 
              `<p style="color: #28a745;"><strong>✓ Payment Received</strong></p>` :
              `<p style="color: #dc3545;"><strong>⚠ Payment Pending</strong></p>`
            }
          </div>

          <!-- Terms and Conditions -->
          <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #400F45; margin-bottom: 15px;">Terms & Conditions</h3>
            <ul style="margin-left: 20px; line-height: 1.8;">
              <li>All gold jewelry items are hallmarked and certified for purity</li>
              <li>Returns accepted within 30 days with original packaging</li>
              <li>Exchange policy available with current gold rates</li>
              <li>Free insurance coverage for shipping</li>
              <li>Warranty covers manufacturing defects only</li>
              <li>Please retain this invoice for warranty claims</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>Thank you for choosing Shanthi Online Gold!</strong></p>
            <p>For any queries, contact us at +91 98765 43210 or info@shanthionlinegold.com</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
              This is a computer-generated invoice and does not require a physical signature.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 border border-yellow-200",
      "Processing": "bg-blue-100 text-blue-800 border border-blue-200",
      "Shipped": "bg-purple-100 text-purple-800 border border-purple-200",
      "Delivered": "bg-green-100 text-green-800 border border-green-200",
      "Cancelled": "bg-red-100 text-red-800 border border-red-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getStatusActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case "Pending":
        actions.push(
          <button
            key="process"
            onClick={() => handleStatusChange(order._id, "Processing")}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition"
          >
            Process
          </button>
        );
        break;
      case "Processing":
        actions.push(
          <button
            key="ship"
            onClick={() => handleStatusChange(order._id, "Shipped")}
            className="bg-purple-500 text-white px-3 py-1 rounded-md text-xs hover:bg-purple-600 transition"
          >
            Ship
          </button>
        );
        break;
      case "Shipped":
        actions.push(
          <button
            key="deliver"
            onClick={() => handleStatusChange(order._id, "Delivered")}
            className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition"
          >
            Deliver
          </button>
        );
        break;
    }

    if (order.status !== "Cancelled" && order.status !== "Delivered") {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleStatusChange(order._id, "Cancelled")}
          className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition"
        >
          Cancel
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="p-6 bg-gray-50">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#400F45] mb-2">Order Management</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600">
                Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </p>
              <button
                onClick={fetchOrders}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          {/* Logout is provided by AdminLayout */}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Orders</p>
                <p className="text-2xl font-bold text-[#400F45]">{orderStats.total}</p>
              </div>
              <ShoppingCart className="text-[#400F45]" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Revenue</p>
                <p className="text-lg font-bold text-green-600">₹{(orderStats.totalRevenue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
              </div>
              <Calendar className="text-yellow-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processing}</p>
              </div>
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Avg Order</p>
                <p className="text-lg font-bold text-[#400F45]">₹{Math.floor(orderStats.avgOrderValue / 1000)}K</p>
              </div>
              <BarChart3 className="text-[#400F45]" size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400F45] focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400F45] focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400F45] focus:border-transparent"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#400F45] focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <div className="flex gap-2">
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
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              className="bg-[#400F45] text-white px-3 py-1 rounded-md text-xs hover:bg-[#5a1762] transition"
                              title="Download Invoice"
                            >
                              <FileDown size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <ShoppingCart size={48} className="text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No orders found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === page
                        ? 'bg-[#400F45] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-[#400F45] text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-purple-200 mt-1">
                    Order #{selectedOrder.orderId || selectedOrder._id.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={closeOrderModal}
                  className="text-white hover:text-gray-300 transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Order Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                        <ShoppingCart className="mr-2" size={20} />
                        Order Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID:</span>
                          <span className="font-medium">#{selectedOrder.orderId || selectedOrder._id.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">
                            {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-lg text-[#400F45]">
                            ₹{parseFloat(selectedOrder.totalAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                        <Users className="mr-2" size={20} />
                        Customer Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Users className="mr-3 text-gray-400" size={16} />
                          <div>
                            <p className="font-medium">{selectedOrder.customerName}</p>
                            <p className="text-gray-600 text-sm">Customer</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Mail className="mr-3 text-gray-400" size={16} />
                          <div>
                            <p className="font-medium">{selectedOrder.customerEmail}</p>
                            <p className="text-gray-600 text-sm">Email Address</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-3 text-gray-400" size={16} />
                          <div>
                            <p className="font-medium">{selectedOrder.customerPhone}</p>
                            <p className="text-gray-600 text-sm">Phone Number</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                        <CreditCard className="mr-2" size={20} />
                        Payment Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedOrder.paymentStatus === 'Paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedOrder.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products & Shipping */}
                  <div className="space-y-6">
                    {/* Products */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                        <Package className="mr-2" size={20} />
                        Products Ordered
                      </h3>
                      <div className="space-y-3">
                        {selectedOrder.products && selectedOrder.products.length > 0 ? (
                          selectedOrder.products.map((product, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {product.name || 'Gold Jewelry Item'}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {product.description || 'Premium quality gold jewelry'}
                                  </p>
                                  <div className="flex items-center mt-2 text-sm">
                                    <span className="text-gray-600">Qty: {product.quantity || 1}</span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-gray-600">
                                      ₹{(product.price || selectedOrder.totalAmount).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Gold Jewelry Order</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Premium quality gold jewelry items
                                </p>
                                <div className="flex items-center mt-2 text-sm">
                                  <span className="text-gray-600">Qty: 1</span>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <span className="text-gray-600">
                                    ₹{parseFloat(selectedOrder.totalAmount).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                          <MapPin className="mr-2" size={20} />
                          Shipping Address
                        </h3>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{selectedOrder.customerName}</p>
                            <p className="text-gray-600">{selectedOrder.shippingAddress.street}</p>
                            <p className="text-gray-600">
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                            </p>
                            <p className="text-gray-600">PIN: {selectedOrder.shippingAddress.pincode}</p>
                            <p className="text-gray-600">India</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Timeline */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#400F45] mb-4 flex items-center">
                        <Clock className="mr-2" size={20} />
                        Order Timeline
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <p className="font-medium">Order Placed</p>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            ['Processing', 'Shipped', 'Delivered'].includes(selectedOrder.status)
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1">
                            <p className="font-medium">Order Confirmed</p>
                            <p className="text-sm text-gray-600">
                              {selectedOrder.status !== 'Pending' ? 'Confirmed' : 'Waiting for confirmation'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            ['Shipped', 'Delivered'].includes(selectedOrder.status)
                              ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1">
                            <p className="font-medium">Order Shipped</p>
                            <p className="text-sm text-gray-600">
                              {selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered' 
                                ? 'In transit' : 'Not shipped yet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            selectedOrder.status === 'Delivered' ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1">
                            <p className="font-medium">Order Delivered</p>
                            <p className="text-sm text-gray-600">
                              {selectedOrder.status === 'Delivered' ? 'Successfully delivered' : 'Pending delivery'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t pt-6 mt-8">
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#400F45] text-white rounded-lg hover:bg-[#5a1762] transition"
                    >
                      <FileDown size={16} />
                      Download Invoice
                    </button>
                    {getStatusActions(selectedOrder).length > 0 && (
                      <div className="flex gap-2">
                        {getStatusActions(selectedOrder)}
                      </div>
                    )}
                    <button
                      onClick={closeOrderModal}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
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
