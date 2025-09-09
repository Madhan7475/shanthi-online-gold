import React from "react";

const CollectionsSection = () => {
  return (
    <section className="bg-white py-0 px-4 md:py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">
        
        {/* Left Image (Hidden on Mobile) */}
        <img
          src="/chain.jpg"
          alt="Side model"
          className="hidden md:block md:w-1/4 h-auto rounded-xl object-cover"
        />

        {/* Center Block with Text + Image */}
        <div className="flex flex-col items-center w-full md:w-2/4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 text-[#400F45]">
            Collections
          </h2>
          <p className="text-[#400F45] mb-4 text-sm sm:text-base">
            Find your style. Explore our diverse collections!
          </p>
          <img
            src="/Bridal Set.jpg"
            alt="Center collection"
            className="w-full h-auto rounded-xl object-cover"
          />
        </div>

        {/* Right Image (Hidden on Mobile) */}
        <img
          src="/jimiki.jpg"
          alt="Side model"
          className="hidden md:block md:w-1/4 h-auto rounded-xl object-cover"
        />
      </div>

      {/* Mobile Side Images Below */}
      <div className="flex md:hidden gap-4 mt-6">
        <img
          src="/bridal2.jpg"
          alt="Side model"
          className="w-1/2 h-auto rounded-xl object-cover"
        />
        <img
          src="/bridal3.jpg"
          alt="Side model"
          className="w-1/2 h-auto rounded-xl object-cover"
        />
      </div>
    </section>
  );
};

export default CollectionsSection;
