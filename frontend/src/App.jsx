// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { setupAuthListener } from "./utils/setupAuthListener";

// Layouts
import UserLayout from "./components/Layout/UserLayout";

// User Pages
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SigninPage from "./pages/SigninPage";
import RequireAuthPage from "./utils/RequireAuthPage";
import SavedItemsPage from "./pages/SavedItemsPage"; // ✅ Import the new page
import MyOrdersPage from "./pages/MyOrdersPage"; // ✅ Import the new page

// Admin Pages
import AdminLogin from "./pages/login";
import AdminAuth from "./pages/AdminAuth";
import AdminProfiles from "./pages/AdminProfiles";
import AdminAnalytics from "./pages/AdminAnalytics";
import Invoice from "./pages/Invoice";
import AdminPanel from "./pages/Panel";

// Admin Features
import ProductUpload from "./components/Admin/products/ProductUpload";
import ProductList from "./components/Admin/products/ProductList";
import ProductEdit from "./components/Admin/products/ProductEdit";
import OrderManagement from "./components/Admin/products/AdminOrderList";
import AdminDashboard from "./components/Admin/products/AdminDashboard";

// Category Pages
import AllJewellery from "./pages/category/AllJewellery";
import GoldPage from "./pages/category/Gold";
import DiamondPage from "./pages/category/Diamond";
import SilverPage from "./pages/category/Silver";
import EarringsPage from "./pages/category/Earrings";
import RingsPage from "./pages/category/Rings";
import DailyWearPage from "./pages/category/DailyWear";
import BabyItemsPage from "./pages/category/BabyItems";
import WeddingPage from "./pages/category/Wedding";
import SpecialCollectionPage from "./pages/category/Specialcollection";

// Product
import ProductDetail from "./pages/ProductDetail";

// Debug Utility
import DebugFirebaseToken from "./utils/DebugFirebaseToken";

const App = () => {
  useEffect(() => {
    setupAuthListener();
  }, []);

  return (
    <>
      <DebugFirebaseToken />
      <Routes>
        {/* 🛍️ User Routes */}
        <Route path="/" element={<UserLayout />}>
          {/* Public Routes */}
          <Route path="signin" element={<SigninPage />} />
          <Route path="product/:id" element={<ProductDetail />} />

          {/* Protected Routes */}
          <Route path="cart" element={<RequireAuthPage><CartPage /></RequireAuthPage>} />
          <Route path="checkout" element={<RequireAuthPage><CheckoutPage /></RequireAuthPage>} />
          {/* ✅ Add the new protected route for saved items */}
          <Route path="saved-items" element={<RequireAuthPage><SavedItemsPage /></RequireAuthPage>} />
          {/* ✅ Add the new protected route for My Orders */}
          <Route path="my-orders" element={<RequireAuthPage><MyOrdersPage /></RequireAuthPage>} />
        </Route>

        {/* 💍 Category Pages */}
        <Route path="/category/all-jewellery" element={<AllJewellery />} />
        <Route path="/category/gold" element={<GoldPage />} />
        <Route path="/category/diamond" element={<DiamondPage />} />
        <Route path="/category/silver" element={<SilverPage />} />
        <Route path="/category/earrings" element={<EarringsPage />} />
        <Route path="/category/rings" element={<RingsPage />} />
        <Route path="/category/daily-wear" element={<DailyWearPage />} />
        <Route path="/category/baby-items" element={<BabyItemsPage />} />
        <Route path="/category/wedding" element={<WeddingPage />} />
        <Route path="/category/special-collection" element={<SpecialCollectionPage />} />

        {/* 🔐 Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/admin/auth" element={<AdminAuth />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/profiles" element={<AdminProfiles />} />
        <Route path="/admin/products" element={<ProductUpload />} />
        <Route path="/admin/products/list" element={<ProductList />} />
        <Route path="/admin/products/edit/:id" element={<ProductEdit />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/invoices" element={<Invoice />} />
      </Routes>
    </>
  );
};

export default App;
