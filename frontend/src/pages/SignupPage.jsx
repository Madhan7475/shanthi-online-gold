import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, RecaptchaVerifier } from "../firebase";
import { signInWithPhoneNumber } from "firebase/auth";

const SignupPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError("Invalid phone number");
      return;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      { size: "invisible" },
      auth
    );

    try {
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      setConfirmation(result);
      setError("OTP sent to your mobile number");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmation.confirm(otp);
      setError("Signup successful");
    } catch {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[65vh] bg-white text-black">
      <form className="w-full max-w-md bg-white rounded-md border border-gray-200 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-center mb-1">Sign Up</h2>
        <p className="text-sm text-center mb-6 text-gray-500">
          Please Sign Up to your Shanthi Online Gold.
        </p>

        <label className="block text-center mb-2 text-sm font-medium">Enter Your Mobile Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile number"
          className="w-full p-2 border-b-2 border-gray-300 focus:outline-none focus:border-black mb-6 text-center"
        />

        <p className="text-xs text-center text-gray-500 mb-6">
          By clicking on Submit, you are agreeing to our terms & conditions
          and our privacy policy.
        </p>

        {!confirmation ? (
          <button
            type="button"
            onClick={sendOtp}
            className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
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
              className="w-full p-2 border-b-2 border-gray-300 focus:outline-none focus:border-black mb-4 text-center"
            />
            <button
              type="button"
              onClick={verifyOtp}
              className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
            >
              VERIFY OTP
            </button>
          </>
        )}

        <div id="recaptcha-container" className="mt-2" />

        {error && (
          <p className="text-red-500 text-center text-sm mt-4">{error}</p>
        )}

        <div className="mt-6 text-center text-sm">
          <p className="mb-1">
            <Link to="/forgot-password" className="font-semibold underline">
              Forgot Password ?
            </Link>
          </p>
          <p>
            Already have an account with us?{" "}
            <Link to="/signin" className="font-semibold underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
