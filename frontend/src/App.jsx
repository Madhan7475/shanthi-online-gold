// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import UserLayout from "./components/Layout/UserLayout";

// User Pages
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import OTPLogin from "./pages/OTPLogin";

// Admin Pages
import AdminLogin from "./pages/login";
import AdminPanel from "./pages/Panel";
import AdminAuth from "./pages/AdminAuth";

// Admin Features
import ProductUpload from "./components/Admin/products/ProductUpload";
import ProductList from "./components/Admin/products/ProductList";
import ProductEdit from "./components/Admin/products/ProductEdit";
import OrderManagement from "./components/Admin/products/AdminOrderList";
import AdminProfiles from "./pages/AdminProfiles";

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
import AdminAnalytics from "./pages/AdminAnalytics";

import ProductDetail from "./pages/ProductDetail";

// Optional: Add route protection wrapper
// import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🛍️ User Public Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="signin" element={<SigninPage />} />
          <Route path="signup" element={<SignupPage />} />
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

        {/* 🔐 Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 📲 OTP Login */}
        <Route path="/login" element={<OTPLogin />} />

        {/* 🛡️ Admin Panel & Features */}
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/admin/auth" element={<AdminAuth />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/profiles" element={<AdminProfiles />} />



        <Route path="/admin/products" element={<ProductUpload />} />
        <Route path="/admin/products/list" element={<ProductList />} />
        <Route path="/admin/products/edit/:id" element={<ProductEdit />} />
        <Route path="/admin/orders" element={<OrderManagement />} />

        <Route path="/product/:id" element={<ProductDetail />} />

        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
