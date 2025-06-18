import React, { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const OTPLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Setup invisible reCAPTCHA on mount
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved ✅");
        },
      },
      auth
    );

    // Optional: render the invisible widget
    window.recaptchaVerifier.render();
  }, []);

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!phone) return setMessage("📱 Enter a phone number");

    try {
      const formattedPhone = `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setMessage("📨 OTP sent!");
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      setMessage("Failed to send OTP");
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return setMessage("🧪 Enter the OTP");

    try {
      const result = await confirmationResult.confirm(otp);
      setMessage(`✅ Logged in as: ${result.user.phoneNumber}`);
    } catch (error) {
      console.error("❌ Invalid OTP:", error);
      setMessage("❌ Invalid OTP");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">📲 Phone OTP Login</h2>

      <form onSubmit={sendOTP} className="mb-4">
        <input
          type="tel"
          placeholder="Enter phone number"
          className="border p-2 w-full mb-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded w-full">
          Send OTP
        </button>
      </form>

      {confirmationResult && (
        <form onSubmit={verifyOTP}>
          <input
            type="text"
            placeholder="Enter OTP"
            className="border p-2 w-full mb-2"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">
            Verify OTP
          </button>
        </form>
      )}

      <div id="recaptcha-container" />

      {message && (
        <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
};

export default OTPLogin;
