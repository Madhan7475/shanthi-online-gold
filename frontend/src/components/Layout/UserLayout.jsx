// src/components/Layout/UserLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../Common/Header";
import Banner from "../Common/Banner";
import Category from "../Common/Category";
import Footer from "../Common/Footer";
import { Bridal } from "../Common/Bridal";
import Collections from "../Common/Collections";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

      {/* ✅ Apply the gold theme to all toasts globally */}
      <ToastContainer
        toastClassName="gold-toast"
        bodyClassName={() => "text-sm font-medium"}
        position="top-center"
        autoClose={3000}
      />
    </>
  );
};

export default UserLayout;
