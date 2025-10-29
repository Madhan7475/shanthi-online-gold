import React, { useState } from "react";
import { FiSearch, FiHeart, FiSettings } from "react-icons/fi";
import { BsCart3 } from "react-icons/bs";
import { MdLogin, MdLogout } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa"; // ✅ My Orders icon

import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const Topbar = () => {
  const { cartItems, savedItems } = useCart();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const cartCount = isAuthenticated
    ? cartItems.reduce((sum, i) => sum + i.quantity, 0)
    : 0;
  const savedCount = isAuthenticated ? savedItems.length : 0;

  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    }
    setShowSearch(false);
    setSearchValue("");
  };

  if (loading) return null;

  return (
    <>
      {/* Desktop Topbar */}
      <div className="bg-[#400F45] text-white relative z-20 h-20 items-center hidden md:flex">
        <div className="container mx-auto flex justify-between items-center px-4 relative">
          <div className="w-1/3 flex items-center"></div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to="/">
              <img
                src="/logo.svg"
                alt="Shanthi Gold"
                className="h-16 cursor-pointer"
              />
            </Link>
          </div>
          <div className="w-1/3 flex justify-end items-center space-x-4 text-[#FEC878] relative">
            <button
              onClick={() => setShowSearch(true)}
              title="Search"
              className="hover:text-white transition"
            >
              <FiSearch className="h-5 w-5" />
            </button>
            <div className="relative">
              <Link
                to="/saved-items"
                title="Saved Items"
                className="hover:text-white transition"
              >
                <FiHeart className="h-5 w-5" />
              </Link>
              {savedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </div>
            <div className="relative">
              <Link
                to="/cart"
                title="Cart"
                className="hover:text-white transition"
              >
                <BsCart3 className="h-5 w-5" />
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/my-orders"
                  className="text-sm hover:text-white transition whitespace-nowrap"
                >
                  My Orders
                </Link>
                <Link
                  to="/account/settings"
                  className="text-sm hover:text-white transition whitespace-nowrap"
                >
                  Settings
                </Link>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-xs bg-white/10 px-2 py-1 rounded-full truncate max-w-[80px]"
                    title={user?.name || user?.email || "User"}
                  >
                    {(user?.name || user?.email || "User").split(" ")[0]}
                  </span>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="hover:text-white transition text-xs flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded-full"
                  >
                    <span>Logout</span>
                    <MdLogout size={14} />
                  </button>
                </div>
                {/* Admin Button */}
                {(user?.role === "admin" ||
                  user?.isAdmin ||
                  user?.email === "admin@shanthionlinegold.com") && (
                  <Link
                    to="/admin/login"
                    className="bg-[#FEC878] text-black text-xs px-2 py-1 rounded hover:bg-white hover:text-[#2f0a38] transition"
                    title="Admin Panel"
                  >
                    Admin
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/signin"
                className="hover:text-white transition"
                title="Sign In"
              >
                <MdLogin className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-[#400F45] text-[#FEC878] flex justify-around items-center py-3 z-30 md:hidden">
        <button
          onClick={() => setShowSearch(true)}
          title="Search"
          className="hover:text-white transition flex flex-col items-center text-xs"
        >
          <FiSearch className="h-6 w-6" />
          <span>Search</span>
        </button>

        <Link
          to="/saved-items"
          title="Saved Items"
          className="hover:text-white transition relative flex flex-col items-center text-xs"
        >
          <FiHeart className="h-6 w-6" />
          <span>Wishlist</span>
          {savedCount > 0 && (
            <span className="absolute top-0 right-3 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </Link>

        <Link
          to="/cart"
          title="Cart"
          className="hover:text-white transition relative flex flex-col items-center text-xs"
        >
          <BsCart3 className="h-6 w-6" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-3 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          )}
        </Link>

        {isAuthenticated && (
          <Link
            to="/my-orders"
            title="My Orders"
            className="hover:text-white transition flex flex-col items-center text-xs"
          >
            <FaBoxOpen className="h-6 w-6" />
            <span>Orders</span>
          </Link>
        )}

        {isAuthenticated && (
          <Link
            to="/account/settings"
            title="Settings"
            className="hover:text-white transition flex flex-col items-center text-xs"
          >
            <FiSettings className="h-6 w-6" />
            <span>Settings</span>
          </Link>
        )}

        {isAuthenticated ? (
          <button
            onClick={logout}
            title="Logout"
            className="hover:text-white transition flex flex-col items-center text-xs"
          >
            <MdLogout className="h-6 w-6" />
            <span>Logout</span>
          </button>
        ) : (
          <Link
            to="/signin"
            className="hover:text-white transition flex flex-col items-center text-xs"
            title="Sign In"
          >
            <MdLogin className="h-6 w-6" />
            <span>Login</span>
          </Link>
        )}
      </div>

      {/* Search Overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
          showSearch
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {showSearch && (
          <div
            className="absolute inset-0 bg-black bg-opacity-70"
            onClick={() => setShowSearch(false)}
          />
        )}

        <div className="relative w-full max-w-xl px-4 z-[10000]">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full"
            >
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-3 text-black focus:outline-none rounded-l-2xl"
              />
              <button
                type="submit"
                className="px-4 py-4 bg-[#400F45] text-white rounded-l-2x1"
              >
                <FiSearch className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Topbar;
