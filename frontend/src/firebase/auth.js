// src/firebase/auth.js
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);

export const sendOTP = async (phoneNumber) => {
  try {
    // Clear any existing reCAPTCHA verifier
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    // Setup new invisible reCAPTCHA
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" },
      auth
    );

    await window.recaptchaVerifier.render();

    // Send OTP
    return await signInWithPhoneNumber(auth, `+91${phoneNumber}`, window.recaptchaVerifier);
  } catch (error) {
    console.error("Error during OTP send:", error);
    throw error;
  }
};

export const verifyOTP = async (confirmationResult, code) => {
  try {
    return await confirmationResult.confirm(code);
  } catch (error) {
    console.error("OTP verification failed:", error);
    throw error;
  }
};
