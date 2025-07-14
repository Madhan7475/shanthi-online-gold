import React from "react";

const CollectionsSection = () => {
  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Left Image */}
        <img
          src="/bridal2.jpg" // Replace with your actual side image
          alt="Side model"
          className="w-full md:w-1/4 h-auto rounded-xl object-cover"
        />

        {/* Center Block with Text + Image */}
        <div className="flex flex-col items-center w-full md:w-2/4 text-center">
          <h2 className="text-2xl md:text-4xl font-semibold mb-1 text-[#400F45]">Collections</h2>
          <p className="text-[#400F45] mb-4 text-sm md:text-base">
            Find your style. Explore our diverse collections!
          </p>
          <img
            src="/Bridal Set.jpg" // Replace with your actual center image
            alt="Center collection"
            className="w-full h-auto rounded-xl object-cover"
          />
        </div>

        {/* Right Image */}
        <img
          src="/bridal3.jpg" // Reuse or replace with another image
          alt="Side model"
          className="w-full md:w-1/4 h-auto rounded-xl object-cover"
        />
      </div>
    </section>
  );
};

export default CollectionsSection;
