// src/components/Layout/UserLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import Banner from "../Common/Banner";
import Category from "../Common/Category";
import GoldProductList from "../Products/GoldProductsList";
import Footer from "../Common/Footer";

const UserLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      <Header />

      {isHome && (
        <>
          <Banner />
          <Category />
          <GoldProductList />
        </>
      )}

      {/* Renders CartPage or CheckoutPage when you visit /cart or /checkout */}
      <Outlet />

      <Footer />
    </>
  );
};

export default UserLayout;
