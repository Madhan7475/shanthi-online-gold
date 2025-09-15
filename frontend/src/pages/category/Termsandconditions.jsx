import React from "react";
import Layout from "../../components/Common/Layout";

const TermsConditions = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Terms & Conditions Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Terms & Conditions
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          Welcome to{" "}
          <span className="font-semibold text-[#400F45]">
            Shanthi Online Gold
          </span>
          . By accessing or using our website and services, you agree to comply
          with the following Terms & Conditions. Please read them carefully
          before making any purchase or using our platform.
        </p>

        {/* Section 1 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            1. Use of Website
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            The content and services provided on our website are for your
            personal, non-commercial use. Any misuse, unauthorized copying, or
            distribution of content is strictly prohibited.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            2. Product Information
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            We strive to ensure that all product details, descriptions, and
            prices are accurate. However, errors may occasionally occur, and we
            reserve the right to correct such errors without prior notice.
          </p>
        </div>

        {/* Section 3 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            3. Orders & Payments
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            All orders are subject to acceptance and availability. Payments must
            be made using authorized methods, and fraudulent transactions will
            be reported to the concerned authorities.
          </p>
        </div>

        {/* Section 4 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            4. Limitation of Liability
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Shanthi Online Gold shall not be held liable for any indirect,
            incidental, or consequential damages arising from the use of our
            website, products, or services.
          </p>
        </div>

        {/* Section 5 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            5. Amendments
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            We reserve the right to update, modify, or revise these Terms &
            Conditions at any time. Customers are encouraged to review this page
            regularly for any changes.
          </p>
        </div>

        {/* Section 6 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            6. Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            For any questions regarding our Terms & Conditions, please contact
            our support team via email or customer care number. We are always
            here to assist you.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
