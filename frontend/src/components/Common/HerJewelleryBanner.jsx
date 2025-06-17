import React from "react";
import { Link } from "react-router-dom";

const HerJewelleryBanner = () => {
  return (
    <div
      className="w-full h-[500px] bg-cover bg-center flex items-center justify-center text-center relative"
      style={{
        backgroundImage: `url('/gold8.jpg')`, // replace with your image path
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      <div className="relative z-10 max-w-3xl px-4">
        <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
          Jewellery for Her
        </h1>
        <p className="text-white text-lg md:text-xl mb-6">
          Let her smile and shine in the finest gold & diamond designs.
        </p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded shadow-lg hover:bg-yellow-600 transition"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default HerJewelleryBanner;
