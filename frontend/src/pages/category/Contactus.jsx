import React, { useState } from "react";
import Layout from "../../components/Common/Layout";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage("Thank you for your message! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });

      setTimeout(() => setSubmitMessage(""), 5000);
    }, 2000);
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="w-screen h-48 md:h-80 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#400F45]/80 to-[#8B4513]/60 z-10"></div>
        <img
          src="/gold14.jpg"
          alt="Contact Us Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Get In Touch</h1>
            <p className="text-xl md:text-2xl opacity-90">
              We're here to help with all your gold jewelry needs
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-20 max-w-7xl mx-auto py-16">
        {/* Contact Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Phone Card */}
          <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="bg-[#400F45] w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-phone text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-[#400F45] mb-2">Call Us</h3>
            <p className="text-gray-600 mb-4">
              Speak directly with our jewelry experts
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-lg">+91 9663 843 936</p>
              <p className="text-gray-500">Mon - Sat: 9:00 AM - 8:00 PM</p>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="bg-[#400F45] w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-envelope text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-[#400F45] mb-2">
              Email Us
            </h3>
            <p className="text-gray-600 mb-4">Send us your questions anytime</p>
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                info@shanthionlinegold.com
              </p>
              <p className="text-gray-500">24/7 Response</p>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white shadow-lg rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="bg-[#400F45] w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-map-marker-alt text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-[#400F45] mb-2">
              Visit Us
            </h3>
            <p className="text-gray-600 mb-4">
              Experience our gold collection in person
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                K NO-1178, Golden Heights, 1206, 1206P, 9th Cross B Cross Road
              </p>
              <p className="font-semibold text-sm">
                Near Ganesha Temple, Yelahanka New Town, Bengaluru 560064
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-xl rounded-3xl p-8">
              <h2 className="text-3xl font-bold mb-2 text-[#400F45]">
                Send us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24
                hours.
              </p>

              {submitMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#400F45] focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#400F45] focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#400F45] focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Tell us about your jewelry requirements or any questions..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#400F45] focus:border-transparent transition resize-none"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#400F45] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#5a1762] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending Message...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="bg-white shadow-xl rounded-3xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-[#400F45]">
                Business Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Monday - Friday</span>
                  <span className="text-gray-600">9:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Saturday</span>
                  <span className="text-gray-600">9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sunday</span>
                  <span className="text-gray-600">10:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-xl rounded-3xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-[#400F45]">
                Follow Us
              </h3>
              <div className="flex space-x-4">
                <a className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a className="bg-pink-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                  <i className="fab fa-instagram"></i>
                </a>
                <a className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-700 transition">
                  <i className="fab fa-youtube"></i>
                </a>
                <a className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                  <i className="fab fa-whatsapp"></i>
                </a>
              </div>
              <p className="text-gray-600 mt-4 text-sm">
                Stay updated with our latest collections and offers!
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-center mb-8 text-[#400F45]">
            Find Our Store
          </h3>

          <div className="bg-white shadow-xl rounded-3xl overflow-hidden">
            <iframe
              title="Shanthi Online Gold Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.0334142007314!2d77.58332159999999!3d13.0970689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae191f39b05c67%3A0xdfeeb069f96dd1b9!2sSHANTHI%20ONLINE%20GOLD!5e0!3m2!1sen!2sin!4v1764835872747!5m2!1sen!2sin"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              <strong>Address:</strong> 1NO-1178, Golden Heights, 9th Cross B
              Cross Road, Near Ganesha Temple, Yelahanka New Town, Bengaluru,
              Karnataka 560064
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Landmark:</strong> Near Ganesha Temple
            </p>
          </div>
        </div>

        {/* Additional Services */}
        <div className="mt-16 bg-gradient-to-r from-[#400F45] to-[#8B4513] rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">Why Choose Shanthi Online Gold?</h3>
            <p className="text-xl opacity-90">
              Your trusted partner for premium gold jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-certificate text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-2">100% Pure Gold</h4>
              <p className="opacity-80">Certified hallmarked jewelry</p>
            </div>

            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-truck text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-2">Free Delivery</h4>
              <p className="opacity-80">Secure and insured delivery across India</p>
            </div>

            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-exchange-alt text-2xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-2">Easy Exchange</h4>
              <p className="opacity-80">Exchange policy within 24hrs</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
