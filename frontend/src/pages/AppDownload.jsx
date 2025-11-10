import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// App Store URLs - Update these with your actual app URLs
const APP_STORE_URLS = {
  ios: import.meta.env.VITE_IOS_APP_STORE_URL || 'https://apps.apple.com/app/shanthi-online-gold/id123456789',
  android: import.meta.env.VITE_ANDROID_APP_STORE_URL || 'https://play.google.com/store/apps/details?id=com.shanthionlinegold.app',
  fallback: '/' // Redirect to home if not mobile
};

const AppDownload = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const detectDeviceAndRedirect = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Detect iOS devices
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // Redirect to App Store after 2 seconds
        setTimeout(() => {
          window.location.href = APP_STORE_URLS.ios;
        }, 2000);
        return;
      }

      // Detect Android devices
      if (/android/i.test(userAgent)) {
        // Redirect to Play Store after 2 seconds
        setTimeout(() => {
          window.location.href = APP_STORE_URLS.android;
        }, 2000);
        return;
      }

      // Desktop - no redirect, just show the page
    };

    detectDeviceAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      {/* Decorative Background Circles */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-gradient-to-br from-[#ff4757] to-[#ff6348] rounded-full opacity-80 blur-3xl"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-gradient-to-br from-[#a239ca] to-[#c44569] rounded-full opacity-80 blur-3xl"></div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex relative z-10 min-h-screen items-center justify-center px-8 py-12">
        <div className="max-w-7xl w-full grid grid-cols-2 gap-16 items-center">
          {/* Left Side - Phone Mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-80 h-[640px] bg-white rounded-[3rem] border-[14px] border-black shadow-2xl overflow-hidden relative">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl"></div>
                
                {/* Screen Content */}
                <div className="w-full h-full bg-gradient-to-b from-white to-[#faf5fb] flex flex-col items-center justify-center p-8">
                  {/* App Icon with sparkle effect */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#400F45] to-[#a239ca] rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-40 h-40 bg-gradient-to-br from-[#400F45] to-[#a239ca] rounded-3xl flex items-center justify-center shadow-2xl">
                      <img src="/logo.svg" alt="App Icon" className="w-28 h-28" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#400F45] to-[#a239ca] bg-clip-text text-transparent mb-2">Golden Moments</h2>
                  <p className="text-[#400F45]/70 text-sm font-medium">✨ Just A Tap Away</p>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-[#400F45] to-[#a239ca] text-white px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider shadow-lg">
                  ✨ New Mobile Experience
                </span>
              </div>
              <h1 className="text-7xl font-bold leading-tight mb-4">
                <span className="text-[#400F45]">Your Pocket</span>
                <br />
                <span className="bg-gradient-to-r from-[#d4af37] via-[#f0d876] to-[#d4af37] bg-clip-text text-transparent">
                  Jewelry Store
                </span>
              </h1>
              <p className="text-xl text-gray-600 font-medium mt-4 leading-relaxed">
                Carry the brilliance of gold wherever you go. <br />
                <span className="text-[#400F45]">Shop, Compare & Own Premium Jewelry</span> with just a tap.
              </p>
            </div>

            <div className="space-y-3 max-w-md">
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-[#400F45]/5 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#400F45] to-[#a239ca] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#400F45] mb-1 text-lg">Curated Gold Collections</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">From timeless classics to modern masterpieces - discover designs that match your style</p>
                </div>
              </div>
              
              <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-[#400F45]/5 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f0d876] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#400F45] mb-1 text-lg">Live Gold Rate Tracker</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Never miss the right moment - get instant updates on 22K & 24K gold prices</p>
                </div>
              </div>
              
              {/* <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-[#400F45]/5 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4757] to-[#ff6348] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#400F45] mb-1 text-lg">100% Secure Shopping</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Bank-grade encryption, certified jewelry & hassle-free returns guaranteed</p>
                </div>
              </div> */}
            </div>

            <div className="flex items-start gap-8">
              {/* QR Code */}
              <div className="flex-shrink-0 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#400F45] to-[#a239ca] rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white p-5 rounded-2xl shadow-xl border-2 border-[#400F45]/10 group-hover:scale-105 transition-transform duration-300">
                    <img src="/app-download-qr.svg" alt="QR Code" className="w-32 h-32" />
                  </div>
                </div>
                <p className="text-sm text-[#400F45] font-semibold text-center mt-3 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Scan with phone
                </p>
              </div>

              {/* Store Buttons */}
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium mb-3">Or download from:</p>
                <a
                  href={APP_STORE_URLS.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:scale-105 transition-transform duration-300 w-48"
                >
                  <img 
                    src="/app-store.svg" 
                    alt="Download on App Store" 
                    className="w-full h-auto drop-shadow-lg"
                  />
                </a>
                <a
                  href={APP_STORE_URLS.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:scale-105 transition-transform duration-300 w-48"
                >
                  <img 
                    src="/google-play.svg" 
                    alt="Get it on Google Play" 
                    className="w-full h-auto drop-shadow-lg"
                  />
                </a>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-[#400F45] hover:text-[#400F45]/70 font-medium text-sm transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Website
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden relative z-10 py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Phone Mockup */}
          <div className="relative mx-auto" style={{ width: '280px' }}>
            {/* Phone Frame */}
            <div className="w-full h-[560px] bg-white rounded-[2.5rem] border-[12px] border-black shadow-2xl overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10"></div>
              
              {/* Screen Content */}
              <div className="w-full h-full bg-gradient-to-b from-white to-[#faf5fb] flex flex-col items-center justify-center p-6 pt-10">
                {/* App Icon with sparkle effect */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#400F45] to-[#a239ca] rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-[#400F45] to-[#a239ca] rounded-3xl flex items-center justify-center shadow-2xl">
                    <img src="/logo.svg" alt="App Icon" className="w-20 h-20" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#400F45] to-[#a239ca] bg-clip-text text-transparent mb-2">Golden Moments</h2>
                <p className="text-[#400F45]/70 text-sm mb-8 font-medium">✨ Just A Tap Away</p>

                {/* Store Buttons Inside Phone */}
                <div className="space-y-3 w-full px-4">
                  <a
                    href={APP_STORE_URLS.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src="/app-store.svg" 
                      alt="Download on App Store" 
                      className="w-full h-auto"
                    />
                  </a>
                  <a
                    href={APP_STORE_URLS.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src="/google-play.svg" 
                      alt="Get it on Google Play" 
                      className="w-full h-auto"
                    />
                  </a>
                </div>
              </div>
              
              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-black rounded-full"></div>
            </div>
          </div>

          {/* Back Button - Mobile */}
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-[#400F45] hover:text-[#400F45]/70 font-medium text-sm transition-colors mx-auto flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Website
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDownload;
