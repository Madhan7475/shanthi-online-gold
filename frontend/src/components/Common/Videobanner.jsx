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

      
    </div>
  );
};

export default Banner;
