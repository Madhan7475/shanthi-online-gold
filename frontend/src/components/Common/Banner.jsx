import React, { useState, useEffect, useRef, useCallback } from "react";

const bannerImages = ["/gold5.jpg", "/gold9.jpg", "/gold10.jpg", "/gold15.jpg"];

const HeaderBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const slideRef = useRef(null);
  const totalSlides = bannerImages.length;
  const allImages = [...bannerImages, bannerImages[0]]; // Add first image again for loop

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setIsTransitioning(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleTransitionEnd = () => {
    if (currentIndex === totalSlides) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  // After removing transition, re-enable it for next loop
  useEffect(() => {
    if (!isTransitioning) {
      const timeout = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsTransitioning(true);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Banner height */}
      <div className="relative h-[260px] sm:h-[400px] md:h-[520px] lg:h-[640px]">
        <div
          ref={slideRef}
          className={`flex h-full ${isTransitioning ? "transition-transform duration-1000 ease-in-out" : ""}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {allImages.map((src, i) => (
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
              currentIndex % totalSlides === i ? "bg-white" : "bg-gray-400"
            } transition-colors duration-300`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderBanner;
