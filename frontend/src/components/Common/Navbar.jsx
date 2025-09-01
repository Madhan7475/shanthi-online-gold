import React, { useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

const menuData = {
  "All Jewellery": {
    href: "/category/all-jewellery",
    items: [
      { name: "Chains", img: "/gold/chain.jpg", href: "/gold/chains" },
      { name: "Rings", img: "/gold/ring.jpg", href: "/gold/rings" },
      { name: "Earrings", img: "/gold/earrings.jpg", href: "/gold/earrings" },
    ],
  },
  Gold: {
    href: "/category/gold",
    items: [
      { name: "Necklaces", img: "/diamond/necklace.jpg", href: "/diamond/necklaces" },
      { name: "Bracelets", img: "/diamond/bracelet.jpg", href: "/diamond/bracelets" },
      { name: "Studs", img: "/diamond/studs.jpg", href: "/diamond/studs" },
    ],
  },
  Diamond: {
    href: "/category/diamond",
    items: [
      { name: "Bands", img: "/platinum/band.jpg", href: "/platinum/bands" },
      { name: "Rings", img: "/platinum/ring.jpg", href: "/platinum/rings" },
    ],
  },
  Silver: {
    href: "/category/silver",
    items: [
      { name: "Light Chains", img: "/daily/lightchain.jpg", href: "/daily/chains" },
      { name: "Small Pendants", img: "/daily/pendant.jpg", href: "/daily/pendants" },
    ],
  },
  Earrings: {
    href: "/category/earrings",
    items: [
      { name: "Gold Coins", img: "/coins/coin.jpg", href: "/coins" },
      { name: "Gift Cards", img: "/gifts/gift.jpg", href: "/gifts" },
    ],
  },
  Rings: {
    href: "/category/rings",
    items: [
      { name: "Buy Online", img: "/digi/buy.jpg", href: "/digi/buy" },
      { name: "Track Prices", img: "/digi/track.jpg", href: "/digi/track" },
    ],
  },
  "Daily Wear": {
    href: "/category/daily-wear",
    items: [
      { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
      { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
    ],
  },
  "Baby Items": {
    href: "/category/baby-items",
    items: [
      { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
      { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
    ],
  },
  Wedding: {
    href: "/category/wedding",
    items: [
      { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
      { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
    ],
  },
  "Special Collection": {
    href: "/category/special-collection",
    items: [
      { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
      { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
    ],
  },
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (index) => {
    clearTimeout(timeoutRef.current);
    setHoveredMenu(index);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 100);
  };

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

        {/* Desktop Menu */}
        <ul className="hidden md:flex justify-center gap-10 text-sm font-medium tracking-wide flex-1">
          {Object.entries(menuData).map(([menuItem, { href, items }], index) => (
            <li
              key={index}
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to={href}
                className="cursor-pointer hover:text-white transition-all duration-200"
              >
                {menuItem}
              </Link>

              {/* Dropdown */}
              <div
                className={`fixed left-0 w-full bg-white shadow-2xl z-40 border-t overflow-hidden transition-all duration-300 ease-in-out ${
                  hoveredMenu === index
                    ? "opacity-100 max-h-[500px] py-10 pointer-events-auto"
                    : "opacity-0 max-h-0 py-0 pointer-events-none"
                }`}
                style={{
                  top: "124px",
                  transitionDelay: hoveredMenu === index ? "100ms" : "0ms",
                }}
              >
                <div className="max-w-screen-xl mx-auto px-6 flex justify-center gap-6 flex-wrap transition-opacity duration-300">
                  {items.map((item, i) => (
                    <Link
                      key={i}
                      to={item.href}
                      className="flex flex-col items-center w-32 hover:bg-[#fff9e8] p-2 rounded-md transition"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-full border mb-2"
                      />
                      <h3 className="text-xs text-[#3b3b3b] hover:text-[#c29d5f] text-center">
                        {item.name}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out bg-white ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <ul className="flex flex-col p-4 space-y-4 text-[#3b3b3b]">
          {Object.entries(menuData).map(([menuItem, { href, items }], index) => (
            <li key={index} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <Link
                  to={href}
                  className="font-semibold text-lg text-[#A4874F]"
                >
                  {menuItem}
                </Link>
                <button
                  className="text-purple-600 text-[0.5rem]" // ✅ smaller & purple
                  onClick={() =>
                    setHoveredMenu(hoveredMenu === index ? null : index)
                  }
                >
                  ▼
                </button>
              </div>

              {/* Mobile Submenu */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  hoveredMenu === index ? "max-h-[1000px] py-4" : "max-h-0"
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  {items.map((item, i) => (
                    <Link
                      key={i}
                      to={item.href}
                      className="flex flex-col items-center hover:bg-[#fff9e8] p-2 rounded-md transition"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-full border mb-2"
                      />
                      <h3 className="text-xs text-gray-700 text-center">
                        {item.name}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
