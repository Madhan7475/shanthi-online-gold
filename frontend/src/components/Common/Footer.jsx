const Footer = () => {
  return (
    <footer className="bg-[#400F45] text-[#e2c98d] pt-10 pb-6 text-sm">
      <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-6 gap-10">

        {/* Column 1 - Logo & App */}
        <div className="flex flex-col items-center text-center">
        <img
          src="/logo.svg"  // Ensure this matches your actual logo path
          alt="SOG - Legacy of Purity"
          className="h-14 mb-2"
        />

        <p className="mb-2 text-sm">Scan for app</p>

        <img src="/qr.svg" alt="QR Code" className="w-24 mb-3" />

        <div className="flex space-x-2">
          <img src="/google-play.svg" alt="Google Play" className="h-8" />
          <img src="/app-store-01.svg" alt="App Store" className="h-8" />
        </div>
      </div>


        {/* Column 2 - Shopping */}
        <div>
          <h3 className="text-[#e2c98d] font-semibold mb-3">SHOPPING</h3>
          <ul className="space-y-2">
            <li><a href="/category/all-jewellery">Gold Jewellery</a></li>
            <li><a href="/category/diamond">Diamond Jewellery</a></li>
            <li><a href="/category/silver">Silver Jewellery</a></li>
            <li><a href="/category/daily-wear">Daily Were</a></li>
            <li><a href="/category/baby-items">Baby Items</a></li>
            <li><a href="/category/wedding">Wedding</a></li>
            
          </ul>
        </div>

        {/* Column 3 - Useful Links */}
        <div>
          <h3 className="text-[#e2c98d] font-semibold mb-3">Useful Links</h3>
          <ul className="space-y-2">
            <li><a href="#">Delivery Information</a></li>
            <li><a href="#">International Shipping</a></li>
            <li><a href="#">Payment Options</a></li>
            <li><a href="#">Track your Order</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Find a Store</a></li>
          </ul>
        </div>

        {/* Column 4 - Our Company */}
        <div>
          <h3 className="text-[#e2c98d] font-semibold mb-3">OUR COMPANY</h3>
          <ul className="space-y-2">
            <li><a href="#">About us</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Store Location</a></li>
          </ul>
        </div>

        {/* Column 5 - Customer Support */}
        <div>
          <h3 className="text-[#e2c98d] font-semibold mb-3">Customer Support</h3>
          <ul className="space-y-2">
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Privacy Policies</a></li>
            <li><a href="#">Disclaimer</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[#e2c98d] font-semibold mb-3">Contact Us</h3>
          <div className="mt-4 space-y-1 text-sm">
            <p className="text-[#e2c98d] font-semibold">Phone</p>
            <p>+91 999 999 9999</p>
            <p className="text-[#e2c98d] font-semibold mt-2">Chat With Us</p>
            <p>+91 999 999 9999</p>
          </div>
          <div className="mt-4 space-x-4 flex text-white text-lg">
            <a href="#"><i className="fab fa-facebook" /></a>
            <a href="#"><i className="fab fa-x-twitter" /></a>
            <a href="#"><i className="fab fa-instagram" /></a>
            <a href="#"><i className="fab fa-youtube" /></a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mt-10 pt-4 px-6 text-center text-xs text-[#ffffff]">
        © 2025 Shanthi Online Gold. All rights reserved. Unauthorized use strictly prohibited.
      </div>
    </footer>
  );
};

export default Footer;
