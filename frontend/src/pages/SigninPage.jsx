import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import axiosInstance from "../utils/axiosInstance";
import { FcGoogle } from "react-icons/fc";
import { AuthContext } from "../context/AuthContext";

const SigninPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [message, setMessage] = useState("");
  const { forceHydrate } = useContext(AuthContext);
  const navigate = useNavigate();

  // Resend OTP logic
  const [resendAvailable, setResendAvailable] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const startResendCooldown = () => {
    let countdown = 30;
    setResendAvailable(false);
    setResendTimer(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setResendTimer(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        setResendAvailable(true);
      }
    }, 1000);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const phoneNumber = "+91" + phone;
      const res = await axiosInstance.post("/auth/send-otp", { phone: phoneNumber });
      setSessionId(res.data.sessionId);
      setOtpSent(true);
      setMessage("✅ OTP sent!");
      startResendCooldown();
    } catch (err) {
      setMessage("Failed to send OTP: " + (err.response?.data?.message || err.message));
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const phoneNumber = "+91" + phone;
      const res = await axiosInstance.post("/auth/verify-otp", {
        phone: phoneNumber,
        otp,
        sessionId,
      });

      if (res.data.needEmail) {
        setAwaitingEmail(true);
        setMessage("✅ OTP verified! Please enter your email to complete registration.");
        return;
      }

      const { token, user } = res.data;
      if (!token || !user) throw new Error("Missing token or user in response");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      forceHydrate();
      navigate("/");
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || err.message));
    }
  };

  const submitEmailAfterOtp = async () => {
    try {
      const phoneNumber = "+91" + phone;
      const res = await axiosInstance.post("/auth/verify-otp", {
        phone: phoneNumber,
        otp,
        sessionId,
        email,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      forceHydrate();
      navigate("/");
    } catch (err) {
      setMessage("❌ Failed to complete registration.");
    }
  };

  const handleSocialLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken(true);

      const res = await axiosInstance.post(
        "/auth/sync-user",
        { email: user.email, name: user.displayName || "No Name" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      forceHydrate();
      navigate("/");
    } catch {
      setMessage("Google sign-in failed.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[75vh] bg-[#fff9e8] px-4">
      <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-[#f5e1a4] via-[#ffd700] to-[#f5e1a4] shadow-lg">
        <form
          onSubmit={otpSent && !awaitingEmail ? verifyOtp : sendOTP}
          className="bg-white rounded-xl p-6"
        >
          <h2 className="text-2xl font-semibold text-center text-[#d4af37] mb-5">Sign In</h2>

          {/* Phone Field */}
          <label className="block mb-2 text-sm font-medium">Phone Number *</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]*"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            required
            disabled={otpSent}
            className="w-full p-2 border-b-2 border-[#e4d4a0] bg-transparent mb-4"
          />

          {/* OTP Input */}
          {otpSent && !awaitingEmail && (
            <>
              <label className="block mb-2 text-sm font-medium">Enter OTP *</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                required
                className="w-full p-2 border-b-2 border-[#e4d4a0] bg-transparent mb-2"
              />

              <div className="text-sm text-center mt-2">
                {resendAvailable ? (
                  <button
                    type="button"
                    onClick={sendOTP}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-500">
                    Resend available in {resendTimer}s
                  </span>
                )}
              </div>
            </>
          )}

          {/* Email Field (if needed) */}
          {awaitingEmail && (
            <>
              <label className="block mb-2 text-sm font-medium">Your Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full p-2 border-b-2 border-[#e4d4a0] bg-transparent mb-4"
              />
              <button
                type="button"
                onClick={submitEmailAfterOtp}
                className="w-full py-2 rounded bg-[#f4c57c] hover:bg-[#ffd580] text-black font-semibold"
              >
                Submit & Continue
              </button>
            </>
          )}

          {/* Submit/Verify */}
          {!awaitingEmail && (
            <button
              type="submit"
              className={`w-full py-2 rounded font-semibold transition duration-300 text-black shadow ${
                phone.length === 10
                  ? "bg-[#f4c57c] hover:bg-[#ffd580] hover:scale-[1.01]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={phone.length !== 10}
            >
              {otpSent ? "Verify OTP" : "Send OTP"}
            </button>
          )}

          <div className="my-5 text-center text-sm text-gray-500">or</div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSocialLogin}
              className="flex items-center gap-3 px-4 py-2 border rounded-md bg-white hover:bg-gray-100 transition duration-200 shadow text-sm"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
          </div>

          {message && (
            <p
              className="text-center text-sm mt-4"
              style={{ color: message.startsWith("✅") ? "green" : "red" }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default SigninPage;
