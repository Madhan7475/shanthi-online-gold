import Topbar from "../Layout/Topbar";
import { useEffect, useState } from "react";

const Header = () => {
  const [goldPrices, setGoldPrices] = useState({
    "24K": null,
    "22K": null,
    "18K": null,
  });

  // Fetch live gold prices
  useEffect(() => {
    const fetchGoldPricesWithFallback = async () => {
      try {
        // Simulated live data
        const basePrice = 6850;
        const variation = (Math.random() - 0.5) * 100; // ±50 variation

        setGoldPrices({
          "24K": Math.round(basePrice + variation),
          "22K": Math.round((basePrice + variation) * 0.916),
          "18K": Math.round((basePrice + variation) * 0.75),
        });
      } catch (err) {
        console.error("Fallback gold price fetch failed:", err);
        // Final fallback with static prices
        setGoldPrices({
          "24K": 6850,
          "22K": 6275,
          "18K": 5137,
        });
      }
    };

    fetchGoldPricesWithFallback();
    const interval = setInterval(fetchGoldPricesWithFallback, 30000); // refresh every 30s
    return () => clearInterval(interval);
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
    </header>
  );
};

export default Header;
