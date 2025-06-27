import React from "react";

const Banner = () => {
  return (
    <div className="relative w-full h-[50vh] overflow-hidden">
      {/* Image Background */}
      <img
        src="/gold6.jpg" // Replace with your actual image path
        alt="SOG Banner"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-10"></div>

      {/* Text Content */}
      <div className="relative z-20 flex flex-col justify-center items-center h-full text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wider">
          <span className="text-[#e2c98d]">SOG</span> – Legacy of Purity
        </h1>
        <p className="text-white text-lg md:text-xl max-w-xl mb-6">
          Explore timeless collections crafted with elegance and tradition.
        </p>
        <a
          href="/shop"
          className="bg-[#e2c98d] text-black px-6 py-3 rounded shadow hover:bg-[#d5b873] transition"
        >
          Shop Now
        </a>
      </div>
    </div>
  );
};

export default Banner;
