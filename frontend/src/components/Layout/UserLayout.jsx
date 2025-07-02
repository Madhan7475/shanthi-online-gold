// src/components/Layout/UserLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import Banner from "../Common/Banner";
import Category from "../Common/Category";
import GoldProductList from "../Products/GoldProductsList";
import Footer from "../Common/Footer";
import HerJewelleryBanner from "../Common/HerJewelleryBanner";
import Process from "../Common/Process";
import Videobanner from "../Common/Videobanner";

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
          <HerJewelleryBanner/>
          <GoldProductList />
          <Process />
          <Videobanner />

        </>
      )}

      {/* Renders CartPage or CheckoutPage when you visit /cart or /checkout */}
      <Outlet />

      <Footer />
    </>
  );
};

export default UserLayout;
