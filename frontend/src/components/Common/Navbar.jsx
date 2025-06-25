import React, { useState, useRef } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const menuData = {
  "All Jewellery": [
    { name: "Chains", img: "/gold/chain.jpg", href: "/gold/chains" },
    { name: "Rings", img: "/gold/ring.jpg", href: "/gold/rings" },
    { name: "Earrings", img: "/gold/earrings.jpg", href: "/gold/earrings" },
  ],
  "Gold": [
    { name: "Necklaces", img: "/diamond/necklace.jpg", href: "/diamond/necklaces" },
    { name: "Bracelets", img: "/diamond/bracelet.jpg", href: "/diamond/bracelets" },
    { name: "Studs", img: "/diamond/studs.jpg", href: "/diamond/studs" },
  ],
  "Diamond": [
    { name: "Bands", img: "/platinum/band.jpg", href: "/platinum/bands" },
    { name: "Rings", img: "/platinum/ring.jpg", href: "/platinum/rings" },
  ],
  "Silver": [
    { name: "Light Chains", img: "/daily/lightchain.jpg", href: "/daily/chains" },
    { name: "Small Pendants", img: "/daily/pendant.jpg", href: "/daily/pendants" },
  ],
  "Earrings": [
    { name: "Gold Coins", img: "/coins/coin.jpg", href: "/coins" },
    { name: "Gift Cards", img: "/gifts/gift.jpg", href: "/gifts" },
  ],
  "Rings": [
    { name: "Buy Online", img: "/digi/buy.jpg", href: "/digi/buy" },
    { name: "Track Prices", img: "/digi/track.jpg", href: "/digi/track" },
  ],
  "Daily Wear": [
    { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
    { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
  ],
  "Baby Items": [
    { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
    { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
  ],
  "Wedding": [
    { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
    { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
  ],
  "Special Collection": [
    { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
    { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
  ],
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
    <nav className="bg-[#1F0F23] text-[#FEC878] relative shadow-md z-50">
      <div className="flex justify-center items-center px-4 py-3 max-w-screen-xl mx-auto">
        <button
          className="md:hidden text-[#FEC878] text-2xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex justify-center gap-10 text-sm font-medium tracking-wide">
          {Object.entries(menuData).map(([menuItem, subItems], index) => (
            <li
              key={index}
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="cursor-pointer hover:text-[#ffffff] transition-all duration-200">
                {menuItem}
              </div>

              {hoveredMenu === index && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] mt-4 bg-white shadow-2xl py-10 px-10 z-50 rounded-md">
                  <div className="flex justify-center gap-10 flex-wrap">
                    {subItems.map((item, i) => (
                      <a
                        key={i}
                        href={item.href}
                        className="flex flex-col items-center w-36 hover:bg-[#fff9e8] p-2 rounded-md transition"
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-full border mb-2"
                        />
                        <h3 className="text-xs text-[#3b3b3b] hover:text-[#c29d5f] text-center">
                          {item.name}
                        </h3>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
          {Object.entries(menuData).map(([menuItem, subItems], index) => (
            <li key={index} className="border-b pb-2">
              <button
                className="w-full text-left font-semibold text-lg text-[#A4874F]"
                onClick={() =>
                  setHoveredMenu(hoveredMenu === index ? null : index)
                }
              >
                {menuItem}
              </button>

              {/* Mobile Submenu */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  hoveredMenu === index ? "max-h-[1000px] py-4" : "max-h-0"
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  {subItems.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
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
                    </a>
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
