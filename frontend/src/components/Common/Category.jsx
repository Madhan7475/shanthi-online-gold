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
    <section className="py-20 px-4 bg-white">
      {/* Title Section */}
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#400F45]">
          Trending Categories
        </h2>
        <p className="text-base md:text-lg text-[#400F45] mt-2">
          Discover timeless elegance in every piece
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <Link to={`/collection/${cat.slug}`} key={idx}>
            <div className="relative overflow-hidden rounded-xl shadow-md group transition-transform duration-300 hover:scale-105 h-[320px]">
              {/* Image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#a14ca2cc] via-transparent to-transparent opacity-90" />

              {/* Title */}
              <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-white text-lg md:text-xl font-bold tracking-wide text-center">
                {cat.title.toUpperCase()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TrendingCategories;
