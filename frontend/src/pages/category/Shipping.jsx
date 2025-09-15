import React from "react";
import Layout from "../../components/Common/Layout";

const Shipping = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Shipping Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Shipping Policy
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          At <span className="font-semibold text-[#400F45]">Shanthi Online
          Gold</span>, we aim to deliver your orders quickly, safely, and in
          perfect condition. Our Shipping Policy outlines timelines, costs,
          and procedures to ensure transparency.
        </p>

        {/* Section 1 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            1. Shipping Timelines
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Orders are processed and delivered within 7 business days. Delivery timelines
            may vary depending on the destination, availability, and courier
            services. Customers will receive tracking details once shipped.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            2. Shipping Charges
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            We offer free shipping on select orders. For other orders,
            shipping charges will be calculated and displayed at checkout
            before payment is made.
          </p>
        </div>

        {/* Section 3 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            3. Packaging & Security
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            All jewellery is securely packed in tamper-proof packaging to
            ensure safety during transit. Please check the package before
            accepting delivery.
          </p>
        </div>

        {/* Section 4 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            4. International Shipping
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Currently, we ship only within India. International shipping
            options will be introduced soon. Please stay updated through our
            website.
          </p>
        </div>

        {/* Section 5 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            5. Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            For queries regarding shipping or delivery delays, contact our
            customer support team via email or helpline number.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Shipping;
