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


      </Routes>




    </BrowserRouter>
  );
};

export default App;
