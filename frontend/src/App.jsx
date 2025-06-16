// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";


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



        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
