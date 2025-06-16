import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main User Layout */}
        <Route path="/" element={<UserLayout />} />

        {/* Cart Page */}
        <Route path="/cart" element={<CartPage />} />

        {/* Checkout page */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* TODO: Add Admin Layout */}


        {/* <Route path="/admin" element={<AdminLayout />} /> */}
        
      </Routes>

      
    </BrowserRouter>
  );
};

export default App;
