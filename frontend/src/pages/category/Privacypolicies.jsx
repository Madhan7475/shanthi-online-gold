import React from "react";
import Layout from "../../components/Common/Layout";

const Privacypolicies = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Privacy Policies Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Privacy Policies
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          At <span className="font-semibold text-[#400F45]">Shanthi Online
          Gold</span>, we value and respect your privacy. This policy explains
          how we collect, use, and safeguard your information when you interact
          with our website and services.
        </p>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          Any personal details you provide — such as your name, email, phone
          number, or purchase history — are kept secure and are used solely for
          improving your shopping experience, fulfilling your orders, and
          providing personalized recommendations.
        </p>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          We do not sell, trade, or rent your personal information to third
          parties. However, we may share it with trusted service providers to
          ensure smooth delivery of services such as payments, shipping, and
          customer support.
        </p>

        {/* Key Privacy Points */}
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-3 text-[#400F45]">
              Information We Collect
            </h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Personal details (name, contact number, email)</li>
              <li>Billing and shipping addresses</li>
              <li>Transaction history and preferences</li>
              <li>Cookies and browsing data for site improvements</li>
            </ul>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-3 text-[#400F45]">
              Your Rights
            </h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Right to access and update your information</li>
              <li>Right to opt-out of promotional communications</li>
              <li>Right to request deletion of personal data</li>
              <li>Right to secure transactions and safe shopping</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacypolicies;
