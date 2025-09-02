import React, { useState } from "react";
import { FiSearch, FiHeart } from "react-icons/fi";
import { BsCart3 } from "react-icons/bs";
import { MdLogin, MdLogout } from "react-icons/md";
import { GiTwoCoins } from "react-icons/gi";
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
              <img src="/logo.svg" alt="Shanthi Gold" className="h-16 cursor-pointer" />
            </Link>
          </div>
          <div className="w-1/3 flex justify-end items-center space-x-4 text-[#FEC878] relative">
            <button onClick={() => setShowSearch(true)} title="Search" className="hover:text-white transition">
              <FiSearch className="h-5 w-5" />
            </button>
            <div className="relative">
              <Link to="/saved-items" title="Saved Items" className="hover:text-white transition">
                <FiHeart className="h-5 w-5" />
              </Link>
              {savedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </div>
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
            <Link to="/digigold" title="Digi Gold" className="hover:text-white transition flex items-center gap-1">
              <GiTwoCoins className="h-5 w-5 text-[#FFD700]" />
              <span className="text-sm hidden lg:inline">Digi Gold</span>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/my-orders" className="text-sm hover:text-white transition whitespace-nowrap">
                  My Orders
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{user?.name || user?.email || "User"}</span>
                  <button onClick={logout} title="Logout" className="hover:text-white transition text-sm flex items-center gap-1">
                    <span>Logout</span>
                    <MdLogout />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/signin" className="hover:text-white transition" title="Sign In">
                <MdLogin className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/admin/login"
              className="ml-2 bg-[#FEC878] text-black text-xs px-2 py-1 rounded hover:bg-white hover:text-[#2f0a38] transition"
              title="Admin Panel"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-[#400F45] text-[#FEC878] flex justify-around items-center py-3 z-30 md:hidden">
        <button onClick={() => setShowSearch(true)} title="Search" className="hover:text-white transition flex flex-col items-center text-xs">
          <FiSearch className="h-6 w-6" />
          <span>Search</span>
        </button>
        <Link to="/saved-items" title="Saved Items" className="hover:text-white transition relative flex flex-col items-center text-xs">
          <FiHeart className="h-6 w-6" />
          <span>Wishlist</span>
          {savedCount > 0 && (
            <span className="absolute top-0 right-3 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
              {savedCount}
            </span>
          )}
        </Link>
        <Link to="/cart" title="Cart" className="hover:text-white transition relative flex flex-col items-center text-xs">
          <BsCart3 className="h-6 w-6" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-3 bg-[#FEC878] text-black text-[10px] px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          )}
        </Link>
        <Link to="/digigold" title="Digi Gold" className="hover:text-white transition flex flex-col items-center text-xs">
          <GiTwoCoins className="h-6 w-6 text-[#FFD700]" />
          <span>Digi Gold</span>
        </Link>
        {isAuthenticated ? (
          <button onClick={logout} title="Logout" className="hover:text-white transition flex flex-col items-center text-xs">
            <MdLogout className="h-6 w-6" />
            <span>Logout</span>
          </button>
        ) : (
          <Link to="/signin" className="hover:text-white transition flex flex-col items-center text-xs" title="Sign In">
            <MdLogin className="h-6 w-6" />
            <span>Login</span>
          </Link>
        )}
      </div>

      {/* 🔹 Search Overlay (centered for mobile) */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
          showSearch ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Dim background */}
        {showSearch && (
          <div
            className="absolute inset-0 bg-black bg-opacity-70"
            onClick={() => setShowSearch(false)}
          />
        )}

        {/* Centered Search bar */}
        <div className="relative w-full max-w-xl px-4 z-[10000]">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-3 text-black focus:outline-none rounded-l-2xl"
              />
              <button type="submit" className="px-4 py-4 bg-[#400F45] text-white rounded-l-2x1">
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
