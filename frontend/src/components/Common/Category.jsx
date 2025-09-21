import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TrendingCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/categories?featured=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        // Fallback to static data if API fails
        setCategories([
          {
            name: "Gold Necklace",
            image: "/Gold Necklace.jpg",
            slug: "gold-necklace",
          },
          {
            name: "Diamond Ring",
            image: "/Diamond Ring.jpg",
            slug: "diamond-ring",
          },
          {
            name: "Bridal Set",
            image: "/Bridal Set.jpg",
            slug: "bridal-set",
          },
          {
            name: "Gold Bangles",
            image: "/Gold Bangles.jpg",
            slug: "gold-bangles",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getImageSrc = (category) => {
    if (category.image) {
      // If image starts with /, it's already a full path (like /Gold Necklace.jpg)
      if (category.image.startsWith('/')) {
        return category.image;
      }
      // If image doesn't contain / and doesn't start with http, treat as uploaded file
      else if (!category.image.includes('/') && !category.image.startsWith('http')) {
        return `/uploads/${category.image}`;
      }
      // Otherwise use as is
      else {
        return category.image;
      }
    }
    return `/default-category.jpg`;
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#400F45]">
            Trending Categories
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#400F45] mt-2 max-w-xl mx-auto">
            Discover timeless elegance in every piece
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden shadow-lg h-[280px] sm:h-[300px] md:h-[320px] bg-gray-200 animate-pulse"
            >
              <div className="w-full h-full bg-gray-300"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error && categories.length === 0) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#400F45]">
            Trending Categories
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-red-600 mt-2 max-w-xl mx-auto">
            Unable to load categories. Please try again later.
          </p>
        </div>
      </section>
    );
  }

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
        {categories.map((category) => (
          <Link
            to={`/collection/${category.slug}`}
            key={category.slug}
            className="group block rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 h-[280px] sm:h-[300px] md:h-[320px] relative"
          >
            {/* Image */}
            <img
              src={getImageSrc(category)}
              alt={category.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/default-category.jpg';
              }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#a14ca2cc] via-transparent to-transparent opacity-90 pointer-events-none" />

            {/* Title */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white text-base sm:text-lg md:text-xl font-bold tracking-wide text-center px-2">
              {category.name.toUpperCase()}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TrendingCategories;
