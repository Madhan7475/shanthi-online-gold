const Footer = () => {
  // App Store URLs - These should match your AppDownload page configuration
  const appStoreUrls = {
    ios: import.meta.env.VITE_IOS_APP_STORE_URL || 'https://apps.apple.com/app/shanthi-online-gold/id123456789',
    android: import.meta.env.VITE_ANDROID_APP_STORE_URL || 'https://play.google.com/store/apps/details?id=com.shanthionlinegold.app',
    download: '/app-download'
  };

  return (
    <footer className="bg-[#400F45] text-[#e2c98d] pt-10 pb-6 text-sm">
      <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Column 1 - Logo & App */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.svg"
            alt="SOG - Legacy of Purity"
            className="h-14 mb-2"
          />
          <p className="mb-2 text-sm">Scan for app</p>
          <a href={appStoreUrls.download} className="block mb-3 hover:opacity-80 transition-opacity">
            <img src="/app-download-qr.svg" alt="QR Code" className="w-24" />
          </a>
          <div className="flex space-x-2">
            <a 
              href={appStoreUrls.android} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/google-play.svg" alt="Google Play" className="h-8" />
            </a>
            <a 
              href={appStoreUrls.ios} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/app-store.svg" alt="App Store" className="h-8" />
            </a>
          </div>
        </div>


        {/* Column 2 - Shopping */}
        <div>
          <h3 className="font-semibold mb-3">SHOPPING</h3>
          <ul className="space-y-2">
            <li><a href="/category/all-jewellery">Gold Jewellery</a></li>
            <li><a href="/category/diamond">Diamond Jewellery</a></li>
            <li><a href="/category/silver">Silver Jewellery</a></li>
            <li><a href="/category/daily-wear">Daily Wear</a></li>
            <li><a href="/category/baby-items">Baby Items</a></li>
            <li><a href="/category/wedding">Wedding</a></li>
          </ul>
        </div>

        {/* Column 3 - Customer Support */}
        <div>
        <h3 className="font-semibold mb-3">CUSTOMER SUPPORT</h3>
        <ul className="space-y-2">
          <li><a href="/terms-and-conditions">Terms & Conditions</a></li>
          <li><a href="/privacy-policy">Privacy Policies</a></li>
          <li><a href="/category/RefundReturn">Refund & Return</a></li>
          <li><a href="/category/Shipping">Shipping</a></li>
        </ul>
      </div>

        {/* Column 4 - Our Company */}
        <div>
          <h3 className="font-semibold mb-3">OUR COMPANY</h3>
          <ul className="space-y-2">
            <li><a href="/category/Aboutus">About Us</a></li>
            <li><a href="/category/Contactus">Contact Us</a></li>
          </ul>
        </div>

        {/* Column 5 - Contact Info */}
        <div>
          <h3 className="font-semibold mb-3">CONTACT US</h3>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Phone</p>
            <p>+91 9663 843 936</p>
            <p className="font-semibold mt-2">Email us</p>
            <p>info@shanthionlinegold.com</p>
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
      <div className="mt-10 pt-4 px-6 text-center text-xs text-white">
        © 2025 Shanthi Online Gold. All rights reserved. Unauthorized use strictly prohibited.
      </div>
    </footer>
  );
};

export default Footer;
