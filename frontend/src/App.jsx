import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import Login from "./pages/Login"; // Admin login
import Panel from "./pages/Panel"; // Admin dashboard
import OTPLogin from "./pages/OTPLogin";
import ProductUpload from "./components/Admin/products/ProductUpload";
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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* User-facing routes wrapped with layout */}
        <Route path="/" element={<UserLayout />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="signin" element={<SigninPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>

        {/* Admin-only routes (no UserLayout wrapper) */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/panel" element={<Panel />} />

        {/* Login with otp */}
        <Route path="/login" element={<OTPLogin />} />

        {/* Product routing */}
        <Route path="/admin/products" element={<ProductUpload />} />

        {/* other routes */}
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


      </Routes>




    </BrowserRouter>
  );
};

export default App;
