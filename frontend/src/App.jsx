import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

// Utils
import { setupAuthListener } from "./utils/setupAuthListener";
import RequireAuthPage from "./utils/RequireAuthPage";
import DebugFirebaseToken from "./utils/DebugFirebaseToken";

// Layouts
import UserLayout from "./components/Layout/UserLayout";

// User Pages
import SigninPage from "./pages/SigninPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SavedItemsPage from "./pages/SavedItemsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage"; // ✅ Import the new page
import SearchPage from "./pages/SearchPage";
import ProductDetail from "./pages/ProductDetail";



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
import Aboutus from "./pages/category/Aboutus"; // adjust path if needed
import ContactUs from "./pages/category/Contactus";
import Termsandconditions from "./pages/category/Termsandconditions"; // ✅ Import
import Privacypolicies from "./pages/category/Privacypolicies";  // ✅ Import
import CollectionPage from "./pages/category/CollectionPage";


// Admin Pages
import AdminLogin from "./pages/Login";
import AdminAuth from "./pages/AdminAuth";
import AdminProfiles from "./pages/AdminProfiles";
import AdminAnalytics from "./pages/AdminAnalytics";
import Invoice from "./pages/Invoice";
import AdminPanel from "./pages/Panel";
import AdminDashboard from "./components/Admin/products/AdminDashboard";

// Admin Features
import ProductUpload from "./components/Admin/products/ProductUpload";
import ProductList from "./components/Admin/products/ProductList";
import ProductEdit from "./components/Admin/products/ProductEdit";
import OrderManagement from "./components/Admin/products/AdminOrderList";

const App = () => {
  useEffect(() => {
    setupAuthListener();
  }, []);

  return (
    <>
      <DebugFirebaseToken />
      <Routes>
        {/* ---------------- User Routes ---------------- */}
        <Route path="/" element={<UserLayout />}>
          {/* Public Routes */}
          <Route path="signin" element={<SigninPage />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="search" element={<SearchPage />} />

          {/* Protected Routes */}
          <Route
            path="cart"
            element={
              <RequireAuthPage>
                <CartPage />
              </RequireAuthPage>
            }
          />
          <Route
            path="checkout"
            element={
              <RequireAuthPage>
                <CheckoutPage />
              </RequireAuthPage>
            }
          />
          <Route
            path="saved-items"
            element={
              <RequireAuthPage>
                <SavedItemsPage />
              </RequireAuthPage>
            }
          />
          <Route
            path="my-orders"
            element={
              <RequireAuthPage>
                <MyOrdersPage />
              </RequireAuthPage>
            }
          />
          {/* ✅ Add the new route for a single order */}
          <Route
            path="/order/:orderId"
            element={
              <RequireAuthPage>
                <OrderDetailPage />
              </RequireAuthPage>
            }
          />
        </Route>

        {/* ---------------- Category Pages ---------------- */}
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
        <Route path="/category/Aboutus" element={<Aboutus />} />   {/* ✅ New Route */}
        <Route path="/category/ContactUs" element={<ContactUs />} />
        <Route path="/category/Termsandconditions" element={<Termsandconditions />} /> {/* ✅ New Route */}
        <Route path="/category/Privacypolicies" element={<Privacypolicies />} /> {/* ✅ New Route */}
        <Route path="/collection/:slug" element={<CollectionPage />} />

        {/* ---------------- Admin Routes ---------------- */}
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
