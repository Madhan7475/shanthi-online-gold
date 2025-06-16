const Footer = () => {
  return (
    <footer className="bg-yellow-50 border-t text-black pt-10 pb-6 text-sm">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Column 1 */}
        <div>
          <h3 className="font-semibold mb-3">SHOPPING</h3>
          <ul className="space-y-1">
            <li><a href="#">Gold Jewellery</a></li>
            <li><a href="#">Diamond Jewellery</a></li>
            <li><a href="#">Platinum Jewellery</a></li>
            <li><a href="#">Gold Coin</a></li>
            <li><a href="#">Digi Gold</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">CSR</a></li>
            <li><a href="#">Gold Rate</a></li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-semibold mb-3">CUSTOMER SERVICES</h3>
          <ul className="space-y-1">
            <li><a href="#">Terms of Use</a></li>
            <li><a href="#">Scheme Payment</a></li>
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">Cancellation Policy</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Return / Exchange Policy</a></li>
            <li><a href="#">Gift Card Policy</a></li>
            <li><a href="#">Customize Product</a></li>
            <li><a href="#">Gold Coin Make On Request</a></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-semibold mb-3">LET US HELP YOU</h3>
          <ul className="space-y-1">
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Payment FAQ</a></li>
            <li><a href="#">Ring Size Guide</a></li>
            <li><a href="#">Bangle Size Guide</a></li>
            <li><a href="#">Education</a></li>
            <li><a href="#">Offer Zone</a></li>
            <li><a href="#">Sitemap</a></li>
            <li><a href="#">HUID FAQ</a></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className="font-semibold mb-3">OUR COMPANY</h3>
          <ul className="space-y-1">
            <li><a href="#">About Us</a></li>
            <li><a href="#">History</a></li>
            <li><a href="#">Career</a></li>
            <li><a href="#">Store Locator</a></li>
            <li><a href="#">Feedback</a></li>
            <li><a href="#">Media</a></li>
          </ul>
        </div>

        {/* Column 5 */}
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-3">
            SHOP FROM SHANTHI ONLINE. ANYTIME. ANYWHERE
          </h3>
          <p className="text-xs mb-3">
            Find the best Gold & Diamond Jewellery with just a click. Our online store
            brings you the latest designs with the safest shopping experience.
          </p>
          <div className="flex space-x-4 items-start">
            <img
              src="/qr-code.png"
              alt="QR Code"
              className="w-20 h-20 object-contain"
            />
            <div className="space-y-2">
              <img src="/google-play.png" alt="Google Play" className="h-8" />
              <img src="/app-store.png" alt="App Store" className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t mt-10 pt-4 flex flex-col md:flex-row items-center justify-between text-xs px-4">
        <p>
          © 2025 Shanthi Online Gold. All rights reserved. Unauthorized use strictly prohibited.
        </p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#"><i className="fab fa-facebook-f" /></a>
          <a href="#"><i className="fab fa-x-twitter" /></a>
          <a href="#"><i className="fab fa-instagram" /></a>
          <a href="#"><i className="fab fa-youtube" /></a>
          <a href="#"><i className="fas fa-envelope" /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
