import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Common/Layout";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.error("Failed to fetch product", err));
  }, [id]);

  if (!product) return <div className="text-center p-6">Loading...</div>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        <img
          src={`http://localhost:5000/uploads/${product.images[0]}`}
          alt={product.title}
          className="w-full h-96 object-cover rounded-lg shadow"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{product.title}</h1>
          <p className="text-lg text-gray-600 mb-2">{product.category}</p>
          <p className="text-xl font-semibold text-[#c29d5f] mb-6">
            ₹{product.price.toLocaleString()}
          </p>
          <p className="text-gray-700">{product.description || "No description provided."}</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
