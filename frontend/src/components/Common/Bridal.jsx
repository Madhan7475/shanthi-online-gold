import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Bridal Carousel Component
 * - Auto-playing carousel with drag & arrow navigation
 * - Smooth transitions using Framer Motion
 * - Focused center image with surrounding preview images
 */
export const Bridal = () => {
  // Image list
  const images = [
    "/bridal1.jpg",
    "/bridal2.jpg",
    "/bridal3.jpg",
    "/bridal4.jpg",
    "/bridal5.jpg",
    "/bridal6.jpg",
  ];

  // Current center index (default = 2nd image)
  const [currentIndex, setCurrentIndex] = useState(2);
  const autoplayRef = useRef(null);

  // Go to next slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Go to previous slide
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-play every 4s
  useEffect(() => {
    autoplayRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(autoplayRef.current);
  }, [nextSlide]);

  // Handle drag navigation
  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50) nextSlide(); // swipe left
    else if (info.offset.x > 50) prevSlide(); // swipe right
  };

  return (
    <section className="py-10 px-3 bg-white text-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 text-[#400F45]">
          Bridal Collections
        </h2>
        <p className="text-[#400F45] text-sm sm:text-base">
          Explore our diverse selections. Find your style
        </p>
      </motion.div>

      {/* Carousel */}
      <div className="relative max-w-7xl mx-auto mt-8 overflow-hidden h-[320px] sm:h-[420px] md:h-[560px]">
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 
          text-[#400F45] bg-white/80 hover:bg-white p-1 sm:p-2 rounded-full shadow-md"
        >
          <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 
          text-[#400F45] bg-white/80 hover:bg-white p-1 sm:p-2 rounded-full shadow-md"
        >
          <ChevronRight size={18} className="sm:w-6 sm:h-6" />
        </button>

        {/* Image Strip */}
        <motion.div
          className="flex justify-center items-center gap-2 sm:gap-4 px-1 sm:px-6 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          {[-2, -1, 0, 1, 2].map((offset) => {
            const index = (currentIndex + offset + images.length) % images.length;

            // Adjust size based on offset
            let size = "w-24 h-[160px] opacity-40 sm:w-32 sm:h-[220px]";
            if (offset === 0) {
              size =
                "w-48 h-[260px] sm:w-60 sm:h-[360px] md:w-80 md:h-[520px] opacity-100 scale-105";
            } else if (Math.abs(offset) === 1) {
              size =
                "w-36 h-[200px] sm:w-48 sm:h-[280px] md:w-64 md:h-[420px] opacity-80";
            } else if (Math.abs(offset) === 2) {
              size =
                "w-28 h-[180px] sm:w-36 sm:h-[240px] md:w-48 md:h-[320px] opacity-50";
            }

            return (
              <motion.div
                key={index}
                layout
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`rounded-xl shadow-md ${size}`}
              >
                <img
                  src={images[index]}
                  alt={`Bridal ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                  draggable="false"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
