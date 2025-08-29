import React from "react";
import Layout from "../../components/Common/Layout";

const ContactUs = () => {
  return (
    <Layout>
      {/* Banner */}
      <div className="w-screen h-40 md:h-72 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <img
          src="/gold14.jpg"
          alt="Contact Us Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-6xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-[#400F45] text-center">
          Contact Us
        </h1>
        <p className="text-center text-gray-700 mb-10 max-w-2xl mx-auto">
          We’d love to hear from you! Please use the form below or reach out
          through our contact details.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-4 text-[#400F45]">
              Send us a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-[#400F45] focus:border-[#400F45]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-[#400F45] focus:border-[#400F45]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="Write your message..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-[#400F45] focus:border-[#400F45]"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#400F45] text-white py-2 rounded-lg hover:bg-[#5a1762] transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info + Map */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-4 text-[#400F45]">
                Contact Information
              </h2>
              <p className="mb-3">
                <span className="font-semibold">Phone:</span> +91 999 999 9999
              </p>
              <p className="mb-3">
                <span className="font-semibold">Email:</span>{" "}
                support@shanthi.online
              </p>
              <p className="mb-3">
                <span className="font-semibold">Address:</span> Shanthi Online
                Gold, Main Street, Chennai, India
              </p>

              <div className="flex space-x-4 mt-4 text-xl text-[#400F45]">
                <a href="#"><i className="fab fa-facebook"></i></a>
                <a href="#"><i className="fab fa-x-twitter"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-youtube"></i></a>
              </div>
            </div>

            {/* Google Map */}
            <div className="rounded-2xl overflow-hidden shadow-md">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.888888888888!2d80.270718!3d13.082680!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265abcd123!2sChennai!5e0!3m2!1sen!2sin!4v0000000000000"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
