import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";

const Header = () => {
  const [goldPrices, setGoldPrices] = useState({
    "24K": null,
    "22K": null,
    "18K": null,
  });

  // Fetch live gold prices
  useEffect(() => {
    const fetchGoldPrices = async () => {
      try {
        const response = await fetch("https://api.example.com/gold-prices"); // replace with real API
        const data = await response.json();
        setGoldPrices({
          "24K": data["24K"],
          "22K": data["22K"],
          "18K": data["18K"],
        });
      } catch (err) {
        console.error("Failed to fetch gold prices:", err);
      }
    };

    fetchGoldPrices();
    const interval = setInterval(fetchGoldPrices, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const tickerItems = ["24K", "22K", "18K"];

  return (
    <header className="sticky top-0 z-30">
      {/* Live Gold Ticker */}
      <div className="bg-[#fec878] text-black text-xs font-medium py-1 shadow-md">
        <div className="flex items-center space-x-2 px-3">
          <span className="font-semibold mr-2">Today's Gold Rate:</span>
          {tickerItems.map((karat, i) => (
            <div key={i} className="flex items-center">
              <span className="font-semibold">{karat}</span>{" "}
              <span>
                {goldPrices[karat] !== null
                  ? `₹${goldPrices[karat].toLocaleString()}`
                  : "Loading..."}
              </span>
              {i < tickerItems.length - 1 && (
                <span className="mx-1 text-black/70">|</span>
              )}
            </div>
          ))}
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
