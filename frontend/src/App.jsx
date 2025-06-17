// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import Login from "./pages/Login"; // or wherever your Login.jsx is
import Panel from "./pages/Panel";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Everything under UserLayout */}
        <Route path="/" element={<UserLayout />}>
        
          {/* Home */}
          <Route index element={null} />

          {/* Cart & Checkout are nested */}
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />

          
          {/* Auth routes */}
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* other routes */}
          <Route path="/admin/login" element={<Login />} />

          {/* admin panel */}
          <Route path="/admin/panel" element={<Panel/>} />



        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
