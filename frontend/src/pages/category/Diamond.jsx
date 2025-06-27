import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Common/Layout"; // Make sure this exists

const DiamondPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => {
        const diamondItems = res.data.filter(
          (p) => p.category.toLowerCase() === "diamond"
        );
        setProducts(diamondItems);
      })
      .catch((err) => console.error("Failed to load diamond products", err));
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Diamond Jewellery</h1>
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
    </Layout>
  );
};

export default DiamondPage;
