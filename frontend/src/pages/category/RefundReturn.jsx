import React from "react";
import Layout from "../../components/Common/Layout";

const RefundReturn = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Refund & Return Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Refund & Return Policy
        </h1>

        <p className="text-gray-700 leading-relaxed mb-6 text-justify">
          At <span className="font-semibold text-[#400F45]">Shanthi Online
          Gold</span>, we strive to provide you with the best shopping
          experience. If for any reason you are not satisfied with your
          purchase, our Refund & Return Policy ensures a transparent and
          hassle-free process.
        </p>

        {/* Section 1 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            1. Eligibility for Returns
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Returns are accepted within 7 days of delivery provided the
            jewellery is unused, unworn, and in its original condition with
            all tags and packaging intact. Customized or engraved items are
            not eligible for return unless defective.
          </p>
        </div>

        {/* Section 2 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            2. Return Process
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            To initiate a return, please contact our customer support team
            with your order details. Once approved, you will receive
            instructions for secure packaging and courier pickup/drop.
          </p>
        </div>

        {/* Section 3 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            3. Refunds
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Refunds will be processed within 7–10 business days after the
            returned item is inspected and approved. Refunds will be credited
            back to the original payment method used during purchase.
          </p>
        </div>

        {/* Section 4 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            4. Exchanges
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            Exchanges are available for products of equal or higher value,
            subject to stock availability. Additional charges may apply in
            case of price differences.
          </p>
        </div>

        {/* Section 5 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-[#400F45]">
            5. Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed text-justify">
            For any queries regarding Refunds & Returns, please reach out to
            our support team via email or customer care number. We are always
            here to assist you.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default RefundReturn;
