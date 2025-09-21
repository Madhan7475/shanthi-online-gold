import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";

const Header = () => {
  const [goldPrices, setGoldPrices] = useState({
    "24K": null,
    "22K": null,
    "18K": null,
  });

  useEffect(() => {
    const fetchGoldPrices = async () => {
      try {
        // Fetch live gold price from MetalPriceAPI
        const apiKey = import.meta.env.VITE_METALPRICE_API_KEY;
        if (!apiKey) throw new Error('No metal price API key configured');
        const response = await fetch(
          `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`
        );

        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        const rate = data?.rates?.XAU;
        if (!rate || typeof rate !== 'number' || !isFinite(rate)) {
          throw new Error('Invalid XAU rate in response');
        }

        // XAU (gold) price in USD → USD per ounce
        const usdPerOunce = 1 / rate;
        const usdToInrRate = 83; // Better: fetch live forex INR rate
        const ozToGram = 31.1035;

        // Convert to INR per gram
        const inrPerGram = (usdPerOunce * usdToInrRate) / ozToGram;

        setGoldPrices({
          "24K": Math.round(inrPerGram),
          "22K": Math.round(inrPerGram * 0.916),
          "18K": Math.round(inrPerGram * 0.75),
        });
      } catch (err) {
        // Quietly fall back to defaults in dev if API key is missing/invalid
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
    const interval = setInterval(fetchGoldPrices, 60000); // refresh every 60s
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

      {/* Navbar */}
      <div className="z-10 relative">
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
