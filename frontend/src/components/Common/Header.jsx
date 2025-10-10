import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const Header = () => {
  const [goldPrices, setGoldPrices] = useState({
    "24K": null,
    "22K": null,
    "18K": null,
  });

  useEffect(() => {

    const fetchGoldPrices = async () => {
      try {
        // Fetch normalized INR/gram prices from backend (cached, single provider call daily at noon)
        const res = await axiosInstance.get("/market/gold/price");
        const { pricePerGram24kInr, pricePerGram22kInr } = res.data || {};

        if (typeof pricePerGram24kInr !== "number" || typeof pricePerGram22kInr !== "number") {
          throw new Error("Invalid response from backend");
        }

        setGoldPrices({
          "24K": Math.round(pricePerGram24kInr),
          "22K": Math.round(pricePerGram22kInr),
          "18K": Math.round(pricePerGram24kInr * 0.75),
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Gold price API unavailable, using fallback:", err?.message || err);
        }
        setGoldPrices({
          "24K": 11194,
          "22K": 10261,
          "18K": 8396,
        });
      }
    };

    fetchGoldPrices();
    // No periodic refresh: backend updates once daily at noon IST. Frontend fetches once per load.
    return () => { };
  }, []);

  const tickerItems = ["24K", "22K", "18K"];

  return (
    <header className="sticky top-0 z-30">
      {/* Live Gold Ticker */}
      <div className="bg-[#400F45] text-white text-xs font-medium py-1 shadow-sm">
        <div className="flex items-center px-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
              <span className="font-semibold text-xs">LIVE:</span>
            </div>
            {tickerItems.map((karat, i) => (
              <div key={i} className="flex items-center">
                <span className="font-semibold text-yellow-400 text-xs">{karat}</span>
                <span className="ml-1 font-bold text-xs">
                  {goldPrices[karat] !== null
                    ? `₹${goldPrices[karat].toLocaleString()}`
                    : "Loading..."}
                </span>
                {i < tickerItems.length - 1 && (
                  <span className="mx-1.5 text-white/60 text-xs">•</span>
                )}
              </div>
            ))}
            <div className="text-xs text-white/70 ml-4">
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Topbar */}
      <div className="z-20 relative">
        <Topbar />
      </div>

      {/* Navbar */}
      <div className="z-10 relative">
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
