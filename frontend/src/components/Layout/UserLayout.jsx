// src/components/Layout/UserLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import Banner from "../Common/Banner";
import Category from "../Common/Category";
import Footer from "../Common/Footer";
import { Bridal } from "../Common/Bridal";
import Collections from "../Common/Collections"; // ✅ Use default import here

const UserLayout = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      <Header />

      {isHome && (
        <>
          <Banner />
          <Bridal />
          <Collections />
          <Category />
          
        </>
      )}

      <Outlet />
      <Footer />
    </>
  );
};

export default UserLayout;
