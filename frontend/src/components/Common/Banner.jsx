import React, { useEffect, useRef, useState, useCallback } from "react";

const bannerImages = ["/gold5.jpg", "/gold9.jpg", "/gold10.jpg"];

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);
  const totalSlides = bannerImages.length;
  const images = [...bannerImages, bannerImages[0]]; // Clone first for seamless loop

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleTransitionEnd = () => {
    if (currentIndex === totalSlides) {
      if (slideRef.current) {
        slideRef.current.style.transition = "none";
        setCurrentIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (slideRef.current) {
              slideRef.current.style.transition = "transform 1s ease-in-out";
            }
          });
        });
      }
    }
  };

  const goToSlide = (index) => setCurrentIndex(index);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Banner Container */}
      <div className="relative h-[240px] sm:h-[360px] md:h-[480px] lg:h-[600px]">
        <div
          ref={slideRef}
          className="flex w-full h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {images.map((image, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0">
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors duration-300 ${
              index === currentIndex % totalSlides ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
