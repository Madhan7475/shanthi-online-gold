import React, { useState } from "react";
import { TbBrandMeta } from "react-icons/tb";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
import { FiSearch, FiUser } from "react-icons/fi";
import { BsCart3 } from "react-icons/bs";
import { MdLogin } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const Topbar = () => {
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchValue);
    setShowSearch(false);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="bg-[#400F45] text-white relative z-20">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
       

          {/* Center - Logo */}
          <div className="flex justify-center flex-grow">
            <Link to="/">
              <img
                src="/logo.svg"
                alt="Shanthi Gold"
                className="h-16 cursor-pointer"
              />
            </Link>
          </div>

          {/* Right - Actions */}
          <div className="hidden md:flex items-center space-x-4 text-[#FEC878]">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              title="Search"
              className="hover:text-white transition"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Cart */}
            <div className="relative">
              <Link to="/cart" title="Cart" className="hover:text-white transition">
                <BsCart3 className="h-5 w-5" />
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Auth Links */}
            <Link to="/signin" className="hover:text-white transition" title="Sign In">
              <MdLogin className="h-5 w-5" />
            </Link>
            <Link to="/signup" className="hover:text-white transition" title="Sign Up">
              <FiUser className="h-5 w-5" />
            </Link>

            {/* Admin Button */}
            <Link
              to="/admin/login"
              className="ml-2 bg-[#FEC878] text-black text-xs px-3 py-1 rounded hover:bg-white hover:text-[#2f0a38] transition"
              title="Admin Panel"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-4 py-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full border border-gray-300 rounded-md overflow-hidden"
            >
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="SEARCH FOR JEWELLERY"
                className="w-full px-4 py-2 text-sm focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="bg-transparent text-gray-500 px-4 hover:text-black"
              >
                <FiSearch className="h-5 w-5" />
              </button>
            </form>
            <button
              onClick={() => setShowSearch(false)}
              className="ml-4 text-xl text-gray-600 hover:text-black"
              aria-label="Close search"
            >
              <IoClose />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
