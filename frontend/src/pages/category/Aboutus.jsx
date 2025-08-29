import React from "react";
import Layout from "../../components/Common/Layout";

const AboutUs = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="About Us Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          About Us
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          Welcome to <span className="font-semibold text-[#400F45]">Shanthi
          Online Gold</span>, your trusted destination for fine jewellery.
          With decades of craftsmanship and tradition, we take pride in
          bringing you elegant collections that blend timeless artistry with
          modern design.
        </p>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          From intricate <span className="font-semibold">gold and diamond
          jewellery</span> to contemporary pieces crafted with gemstones and
          platinum, our collections are designed to celebrate every moment —
          from weddings and festive occasions to everyday elegance.
        </p>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          Our mission is to make jewellery shopping convenient and enjoyable,
          ensuring authenticity, quality, and transparency at every step. We
          are committed to building trust with our customers by providing
          certified jewellery, secure shopping experiences, and personalized
          service.
        </p>

        {/* Vision & Values */}
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-3 text-[#400F45]">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become a household name in jewellery retail, blending heritage
              with innovation, and bringing timeless designs closer to every
              jewellery lover across India and beyond.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-3 text-[#400F45]">Our Values</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Authenticity and transparency in every piece</li>
              <li>Customer-first approach with personalized care</li>
              <li>Commitment to craftsmanship and innovation</li>
              <li>Ethical sourcing and sustainable practices</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
