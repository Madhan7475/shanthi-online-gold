import React from 'react';

const Celebrationedit = () => {
  const handleAddToCart = (product) => {
    console.log(`Added to cart: ${product.name}`);
    // Here you can dispatch an action or call an API to add to cart
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Celebration Edit Section 1 */}
      <h2 className="text-3xl font-semibold mb-2">Celebration Edit</h2>
      <p className="text-gray-600 mb-8">
        Life is one big celebration. Dance, dazzle and enjoy with the finest festive jewellery designs.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {[
          {
            name: "Flora Glow Trendy Gold Necklace",
            price: "₹492,332.00",
            img: "/gold/1.png",
          },
          {
            name: "Halo Glow Gold Necklace",
            price: "₹483,186.00",
            img: "/gold/2.png",
          },
          {
            name: "Leaflet Motif Gold Necklace",
            price: "₹375,838.00",
            img: "/gold/3.png",
          },
          {
            name: "Glam Mist Pattern Gold Necklace",
            price: "₹577,657.00",
            img: "/gold/4.png",
          },
        ].map((product, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition">
            <img
              src={product.img}
              alt={product.name}
              className="w-full h-64 object-contain mb-4"
            />
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-[#000] font-semibold mt-2">{product.price}</p>
            <button
              onClick={() => handleAddToCart(product)}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Celebrationedit;
