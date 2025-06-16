import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const menuData = {
  "Gold Jewellery": [
    { name: "Chains", img: "/gold/chain.jpg", href: "/gold/chains" },
    { name: "Rings", img: "/gold/ring.jpg", href: "/gold/rings" },
    { name: "Earrings", img: "/gold/earrings.jpg", href: "/gold/earrings" },
  ],
  "Diamond Jewellery": [
    { name: "Necklaces", img: "/diamond/necklace.jpg", href: "/diamond/necklaces" },
    { name: "Bracelets", img: "/diamond/bracelet.jpg", href: "/diamond/bracelets" },
    { name: "Studs", img: "/diamond/studs.jpg", href: "/diamond/studs" },
  ],
  "Platinum Jewellery": [
    { name: "Bands", img: "/platinum/band.jpg", href: "/platinum/bands" },
    { name: "Rings", img: "/platinum/ring.jpg", href: "/platinum/rings" },
  ],
  "Daily Wear/18KT": [
    { name: "Light Chains", img: "/daily/lightchain.jpg", href: "/daily/chains" },
    { name: "Small Pendants", img: "/daily/pendant.jpg", href: "/daily/pendants" },
  ],
  "Coins & Gifts": [
    { name: "Gold Coins", img: "/coins/coin.jpg", href: "/coins" },
    { name: "Gift Cards", img: "/gifts/gift.jpg", href: "/gifts" },
  ],
  "Digi Gold": [
    { name: "Buy Online", img: "/digi/buy.jpg", href: "/digi/buy" },
    { name: "Track Prices", img: "/digi/track.jpg", href: "/digi/track" },
  ],
  "Gold Scheme": [
    { name: "Monthly Plans", img: "/scheme/plan.jpg", href: "/scheme/monthly" },
    { name: "Refer & Earn", img: "/scheme/refer.jpg", href: "/scheme/refer" },
  ],
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  return (
    <nav className="bg-gradient-to-r from-[#f7e2b8] to-[#FFCD7B] shadow-md border-t z-100 relative">
      {/* Top Container */}
      <div className="flex justify-center items-center px-4 py-4 max-w-screen-xl mx-auto">

        {/* Hamburger Button */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex justify-center gap-8 text-sm font-semibold text-gray-600 relative">
          {Object.entries(menuData).map(([menuItem, subItems], index) => (
            <li key={index} className="relative group">
              <div className="cursor-pointer hover:text-yellow-600 transition">
                {menuItem}
              </div>

              {/* Desktop Dropdown */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] mt-5 bg-white shadow-2xl py-10 px-10 z-50 opacity-0 scale-y-95 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-100 ease-in-out origin-top pointer-events-none group-hover:pointer-events-auto">
                <div className="flex justify-center gap-10 flex-wrap max-w-screen-xl mx-auto">

                  {subItems.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      className="flex flex-col items-center w-40 hover:bg-yellow-50 p-2 rounded-md transition"
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-32 h-32 object-cover rounded-full border mb-2"
                      />
                      <h3 className="text-xs text-gray-700 hover:text-yellow-600 text-center">
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

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out bg-white ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <ul className="flex flex-col p-4 space-y-4 text-gray-800">
          {Object.entries(menuData).map(([menuItem, subItems], index) => (
            <li key={index} className="border-b pb-2">
              <button
                className="w-full text-left font-semibold text-lg text-[#A4874F]"
                onClick={() =>
                  setActiveMenu(activeMenu === index ? null : index)
                }
              >
                {menuItem}
              </button>

              {/* Mobile Submenu */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  activeMenu === index ? "max-h-[1000px] py-4" : "max-h-0"
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  {subItems.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      className="flex flex-col items-center hover:bg-yellow-50 p-2 rounded-md transition"
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
