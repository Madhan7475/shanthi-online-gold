import React from "react";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Gold Necklace",
    image: "/Gold Necklace.jpg",
    slug: "gold-necklace",
  },
  {
    title: "Diamond Ring",
    image: "/Diamond Ring.jpg",
    slug: "diamond-ring",
  },
  {
    title: "Bridal Set",
    image: "/Bridal Set.jpg",
    slug: "bridal-set",
  },
  {
    title: "Gold Bangles",
    image: "/Gold Bangles.jpg",
    slug: "gold-bangles",
  },
];

const TrendingCategories = () => {
  return (
    <section className="py-16 px-4 bg-white">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#400F45]">
          Trending Categories
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-[#400F45] mt-2 max-w-xl mx-auto">
          Discover timeless elegance in every piece
        </p>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {categories.map(({ title, image, slug }) => (
          <Link
            to={`/collection/${slug}`}
            key={slug}
            className="group block rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 h-[280px] sm:h-[300px] md:h-[320px] relative"
          >
            {/* Image */}
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#a14ca2cc] via-transparent to-transparent opacity-90 pointer-events-none" />

            {/* Title */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white text-base sm:text-lg md:text-xl font-bold tracking-wide text-center px-2">
              {title.toUpperCase()}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TrendingCategories;
