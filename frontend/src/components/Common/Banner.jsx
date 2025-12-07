import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bannerImages = ["/gold16.jpg", "/gold9.jpg", "/gold10.jpg", "/gold15.jpg"];

const HeaderBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slideRef = useRef(null);
  const totalSlides = bannerImages.length;
  const [isPaused, setIsPaused] = useState(false);

  // Move to next slide
  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Move to previous slide
  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto slide every 5s (increased for smoother experience)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  // Go to a specific slide
  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index % totalSlides);
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative h-[260px] sm:h-[400px] md:h-[520px] lg:h-[640px]">
        <div
          ref={slideRef}
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {bannerImages.map((src, i) => (
            <div key={i} className="min-w-full h-full">
              <img src={src} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {bannerImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
              currentIndex === i ? "bg-white" : "bg-gray-400"
            } transition-colors duration-300`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderBanner;
