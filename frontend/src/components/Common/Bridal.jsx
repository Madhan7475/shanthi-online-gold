import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const Bridal = () => {
  const images = [
    "/bridal1.jpg",
    "/bridal2.jpg",
    "/bridal3.jpg",
    "/bridal4.jpg",
    "/bridal5.jpg",
    "/bridal6.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(2);
  const autoplayRef = useRef();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    autoplayRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(autoplayRef.current);
  }, [nextSlide]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50) nextSlide();
    else if (info.offset.x > 50) prevSlide();
  };

  return (
    <section className="py-12 px-4 bg-white text-center"> 
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-[#400F45]">
          Bridal Collections
        </h2>
        <p className="text-[#400F45] text-sm sm:text-base ">
          Explore our diverse selections. Find your style
        </p>
      </motion.div>

      {/* Carousel */}
      <div className="relative max-w-7xl mx-auto mt-10 overflow-hidden h-[420px] sm:h-[500px] md:h-[560px]">
        {/* Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-[#400F45] hover:bg-white p-2 rounded-full shadow-md"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-[#400F45] hover:bg-white p-2 rounded-full shadow-md"
        >
          <ChevronRight size={22} />
        </button>

        {/* Image Strip */}
        <motion.div
          className="flex justify-center items-center gap-4 px-2 sm:px-6 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          {[-2, -1, 0, 1, 2].map((offset) => {
            const index = (currentIndex + offset + images.length) % images.length;

            let size = "w-32 h-[220px] opacity-40";
            if (offset === 0)
              size =
                "w-60 sm:w-72 md:w-80 h-[320px] sm:h-[480px] md:h-[540px] opacity-100 scale-105";
            else if (Math.abs(offset) === 1)
              size =
                "w-48 sm:w-60 md:w-64 h-[280px] sm:h-[420px] md:h-[480px] opacity-80";
            else if (Math.abs(offset) === 2)
              size = "w-36 sm:w-44 md:w-48 h-[240px] sm:h-[360px] opacity-50";

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
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
