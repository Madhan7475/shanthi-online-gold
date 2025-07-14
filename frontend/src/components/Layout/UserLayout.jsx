// src/components/Layout/UserLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import Banner from "../Common/Banner";
import Category from "../Common/Category";
import Footer from "../Common/Footer";
import { Bridal } from "../Common/Bridal";
import Collections from "../Common/Collections"; // ✅ Use default import here
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useEffect } from "react";


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

      {/* ✅ Toasts render at the bottom of the layout */}
      <ToastContainer position="top-center" autoClose={900} />
    </>
  );

};

export default UserLayout;
