import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

const menuData = {
  "All Jewellery": "/category/all-jewellery",
  Gold: "/category/gold",
  Diamond: "/category/diamond",
  Silver: "/category/silver",
  Earrings: "/category/earrings",
  Rings: "/category/rings",
  "Daily Wear": "/category/daily-wear",
  "Baby Items": "/category/baby-items",
  Wedding: "/category/wedding",
  "Special Collection": "/category/special-collection",
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#1F0F23] text-[#FEC878] sticky top-0 shadow-md z-50">
      <div className="flex justify-between items-center px-4 py-5 md:py-3 max-w-screen-xl mx-auto relative">
        
        {/* Hamburger (Mobile) */}
        <button
          className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <FaTimes className="text-[#FEC878] text-2xl" />
          ) : (
            <>
              <span className="block h-0.5 w-full bg-[#FEC878]"></span>
              <span className="block h-0.5 w-full bg-[#FEC878]"></span>
              <span className="block h-0.5 w-full bg-[#FEC878]"></span>
            </>
          )}
        </button>

        {/* Logo (Mobile Only) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden">
          <Link to="/">
            <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Desktop Menu - No Dropdown */}
        <ul className="hidden md:flex justify-center gap-10 text-sm font-medium tracking-wide flex-1">
          {Object.entries(menuData).map(([menuItem, href], index) => (
            <li key={index}>
              <Link
                to={href}
                className="cursor-pointer hover:text-white transition-all duration-200"
              >
                {menuItem}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu - No Dropdown */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out bg-black/70 backdrop-blur-md border-t border-white/20 ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <ul className="flex flex-col p-4 space-y-4 text-white">
          {Object.entries(menuData).map(([menuItem, href], index) => (
            <li key={index} className="border-b border-white/20 pb-2">
              <Link
                to={href}
                className="font-semibold text-lg text-white block"
                onClick={() => setMobileOpen(false)}
              >
                {menuItem}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
