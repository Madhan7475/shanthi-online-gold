import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config"; // adjust path if needed
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";



const SignupPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    setMessage("");
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setMessage("❌ Invalid phone number");
      return;
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );

      const result = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      setConfirmation(result);
      setMessage("✅ OTP sent to your mobile number");
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong. Please try again.");
    }
  };

  const verifyOtp = async () => {
    setMessage("");
    try {
      await confirmation.confirm(otp);
      setMessage("✅ Signup successful");
    } catch {
      setMessage("❌ Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[65vh] bg-[#fff9e8] text-[#3b3b3b]">
      <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-[#f4d88d] via-[#ffd700] to-[#f4d88d] shadow-lg">
        <form className="bg-white rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-center text-[#d4af37] mb-3">
            Sign Up
          </h2>

          <label className="block text-center mb-5 text-sm font-medium">
            Enter Your Mobile Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] mb-4 text-center"
          />

          <p className="text-xs text-center text-[#8a7653] mb-4">
            By clicking on Submit, you agree to our Terms & Conditions and Privacy Policy.
          </p>

          {!confirmation ? (
            <button
              type="button"
              onClick={sendOtp}
              className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-black py-2 rounded hover:opacity-90 transition font-semibold"
            >
              SUBMIT
            </button>
          ) : (
            <>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] mb-4 text-center"
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="w-full bg-[#c29d5f] text-white py-2 rounded hover:bg-[#b9924c] transition font-semibold"
              >
                VERIFY OTP
              </button>
            </>
          )}

          <div id="recaptcha-container" className="mt-2" />

          {message && (
            <p
              className="text-center text-sm mt-3"
              style={{ color: message.includes("✅") ? "green" : "red" }}
            >
              {message}
            </p>
          )}

          <div className="mt-5 text-center text-sm text-[#8a7653]">
            <p className="mb-1">
              <Link to="/forgot-password" className="font-semibold underline text-[#c29d5f]">
                Forgot Password ?
              </Link>
            </p>
            <p>
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold underline text-[#c29d5f]">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
