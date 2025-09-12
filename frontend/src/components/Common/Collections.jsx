import React from "react";

const CollectionsSection = () => {
  return (
    <section className="relative py-0 px-4 md:py-12 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-orange-300 to-yellow-400 rounded-full blur-3xl"></div>
      </div>

      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #DAA520 2px, transparent 0), 
                           radial-gradient(circle at 75px 75px, #B8860B 1px, transparent 0)`,
          backgroundSize: '100px 100px'
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-8">
        
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
      <div className="relative z-10 flex md:hidden gap-4 mt-6">
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
