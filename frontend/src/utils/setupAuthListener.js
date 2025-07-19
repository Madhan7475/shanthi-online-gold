import { auth } from "../firebase/firebaseConfig";

export const setupAuthListener = () => {
  auth.onIdTokenChanged(async (user) => {
    if (user) {
      const token = await user.getIdToken(true); // force refresh
      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: user.email,
          phone: user.phoneNumber,
          name: user.displayName,
          uid: user.uid,
        })
      );
    } else {
      // ✅ Firebase session expired or user signed out
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // ✅ Also clear 2Factor OTP session if present
      localStorage.removeItem("otpUserToken");
      localStorage.removeItem("otpTokenExpiry");
      localStorage.removeItem("phoneNumber");
    }
  });

  // ✅ Check 2Factor OTP expiry (if used)
  const otpExpiry = localStorage.getItem("otpTokenExpiry");
  if (otpExpiry && Date.now() > parseInt(otpExpiry)) {
    localStorage.removeItem("otpUserToken");
    localStorage.removeItem("otpTokenExpiry");
    localStorage.removeItem("phoneNumber");
  }
};
