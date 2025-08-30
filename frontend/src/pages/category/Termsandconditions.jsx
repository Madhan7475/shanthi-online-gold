import React from "react";
import Layout from "../../components/Common/Layout";

const TermsAndConditions = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Terms and Conditions Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Terms & Conditions
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          Welcome to <span className="font-semibold text-[#400F45]">Shanthi
          Online Gold</span>. By accessing or using our website and services, 
          you agree to comply with and be bound by the following Terms & 
          Conditions. Please read them carefully before using our platform.
        </p>

        {/* Section 1 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            1. General
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            All jewellery sold on our platform is subject to availability. 
            We reserve the right to refuse service, cancel orders, or update 
            product details without prior notice.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            2. Pricing & Payments
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Prices displayed are inclusive of applicable taxes unless stated 
            otherwise. We accept payments via secure and authorized channels. 
            In case of pricing errors, we hold the right to cancel or adjust 
            the order.
          </p>
        </div>

        {/* Section 3 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            3. Shipping & Delivery
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Orders will be shipped to the address provided at checkout. 
            Delivery timelines may vary based on location and availability. 
            We are not responsible for delays caused by courier or customs.
          </p>
        </div>

        {/* Section 4 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            4. Returns & Exchanges
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Jewellery once sold can only be returned or exchanged as per 
            our return policy. Customized or personalized items are not 
            eligible for return unless defective.
          </p>
        </div>

        {/* Section 5 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            5. Privacy Policy
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            We value your privacy. All personal data collected will be 
            handled in accordance with our Privacy Policy to ensure 
            confidentiality and security.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TermsAndConditions;
