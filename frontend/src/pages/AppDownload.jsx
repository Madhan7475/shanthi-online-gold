import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// App Store URLs - Update these with your actual app URLs
const APP_STORE_URLS = {
  ios: import.meta.env.VITE_IOS_APP_STORE_URL || 'https://apps.apple.com/app/shanthi-online-gold/id123456789',
  android: import.meta.env.VITE_ANDROID_APP_STORE_URL || 'https://play.google.com/store/apps/details?id=com.shanthionlinegold.app',
  fallback: '/' // Redirect to home if not mobile
};

const AppDownload = () => {
  const navigate = useNavigate();
  const [deviceInfo, setDeviceInfo] = useState({ type: 'unknown', os: 'unknown' });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Detect iOS devices
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return { type: 'mobile', os: 'ios' };
      }

      // Detect Android devices
      if (/android/i.test(userAgent)) {
        return { type: 'mobile', os: 'android' };
      }

      // Detect if it's a mobile device but OS is unknown
      if (/Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        return { type: 'mobile', os: 'unknown' };
      }

      // Desktop or unknown device
      return { type: 'desktop', os: 'unknown' };
    };

    const device = detectDevice();
    setDeviceInfo(device);

    // Auto-redirect based on device
    const redirectTimer = setTimeout(() => {
      if (device.os === 'ios') {
        window.location.href = APP_STORE_URLS.ios;
      } else if (device.os === 'android') {
        window.location.href = APP_STORE_URLS.android;
      } else if (device.type === 'desktop') {
        navigate(APP_STORE_URLS.fallback);
      }
    }, 2000); // 2 second delay to show the message

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  const handleManualRedirect = (platform) => {
    if (platform === 'ios') {
      window.location.href = APP_STORE_URLS.ios;
    } else if (platform === 'android') {
      window.location.href = APP_STORE_URLS.android;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Shanthi Online Gold"
          className="h-20 mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Download Our Mobile App
        </h1>

        {/* Device Detection Status */}
        {deviceInfo.os !== 'unknown' && deviceInfo.type === 'mobile' && (
          <div className="mb-6">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full mb-3">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">
                {deviceInfo.os === 'ios' ? 'iOS' : 'Android'} Detected
              </span>
            </div>
            <p className="text-gray-600">
              Redirecting you to the {deviceInfo.os === 'ios' ? 'App Store' : 'Google Play Store'}...
            </p>
          </div>
        )}

        {deviceInfo.type === 'desktop' && (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Scan the QR code with your mobile device to download the app, or choose your platform below.
            </p>
          </div>
        )}

        {/* Manual Download Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleManualRedirect('ios')}
            className="w-full bg-black text-white py-3 px-6 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="font-semibold">Download on App Store</span>
          </button>

          <button
            onClick={() => handleManualRedirect('android')}
            className="w-full bg-black text-white py-3 px-6 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            <span className="font-semibold">Get it on Google Play</span>
          </button>
        </div>

        {/* QR Code for Desktop Users */}
        {deviceInfo.type === 'desktop' && (
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-3">Scan with your phone</p>
            <img src="/qr.svg" alt="QR Code" className="w-32 h-32 mx-auto" />
          </div>
        )}

        {/* Back to Website Link */}
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-purple-800 hover:text-purple-600 font-medium text-sm"
        >
          ← Back to Website
        </button>
      </div>
    </div>
  );
};

export default AppDownload;
