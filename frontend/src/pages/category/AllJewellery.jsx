import React, { useEffect, useState } from "react";
import axios from "axios";

const AllJewellery = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch all products for 'all-jewellery' category (adjust logic if needed)
    axios.get("http://localhost:5000/api/products")
      .then((res) => {
        const allJewellery = res.data.filter(
          (p) => p.category.toLowerCase() === "all jewellery"
        );
        setProducts(allJewellery);
      })
      .catch((err) => console.error("Failed to load products", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">All Jewellery</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="border p-4 rounded shadow hover:shadow-lg transition"
          >
            <img
              src={`http://localhost:5000/uploads/${product.images[0]}`}
              alt={product.title}
              className="w-full h-40 object-cover rounded"
            />
            <h2 className="mt-2 font-medium">{product.title}</h2>
            <p className="text-sm text-gray-600">{product.category}</p>
            <p className="text-[#c29d5f] font-semibold">₹{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllJewellery;
