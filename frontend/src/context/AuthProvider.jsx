import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { app } from "../firebase/config";

const auth = getAuth(app);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔄 Watch auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // 📲 Send OTP
  const sendOTP = async (phoneNumber, recaptchaId = "recaptcha-container") => {
    setLoading(true);
    try {
      // If already exists, reset to avoid duplicate instance error
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          recaptchaId,
          { size: "invisible" },
          auth
        );
        await window.recaptchaVerifier.render();
      }

      const result = await signInWithPhoneNumber(
        auth,
        `+91${phoneNumber}`,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      return { success: true };
    } catch (error) {
      console.error("📵 Error sending OTP:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Verify OTP
  const verifyOTP = async (otp) => {
    if (!confirmationResult) {
      return { success: false, error: "No confirmation available" };
    }
    try {
      const result = await confirmationResult.confirm(otp);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      console.error("❌ OTP verification failed:", error);
      return { success: false, error };
    }
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("⚠️ Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOTP,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
