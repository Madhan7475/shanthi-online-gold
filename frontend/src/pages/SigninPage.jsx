import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SigninPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, identifier, password);
      setMessage("✅ Signed in successfully");
      // Add redirect logic here if needed
    } catch {
      setMessage("❌ Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[65vh] bg-[#fff9e8] text-[#3b3b3b] px-4">
      <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-[#f5e1a4] via-[#ffd700] to-[#f5e1a4] shadow-lg">
        <form
          onSubmit={handleSignin}
          className="bg-white rounded-xl p-6"
        >
          <h2 className="text-2xl font-semibold text-center text-[#d4af37] mb-5">Sign In</h2>

          <label className="block mb-2 text-sm font-medium">
            Enter Your Mobile Number or Email ID *
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or Mobile"
            required
            className="w-full p-2 border-b-2 border-[#e4d4a0] focus:outline-none focus:border-[#d4af37] bg-transparent mb-6"
          />

          <label className="block mb-2 text-sm font-medium">Password *</label>
          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full p-2 pr-10 border-b-2 border-[#e4d4a0] focus:outline-none focus:border-[#d4af37] bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-[#b89c60]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <p className="text-xs text-[#7e704c] mb-6 text-center">
            By clicking on Submit, you agree to our Terms & Conditions and Privacy Policy.
          </p>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-black py-2 rounded hover:opacity-90 transition font-semibold"
          >
            SUBMIT
          </button>

          <div className="flex justify-between mt-4 text-sm text-[#3b3b3b]">
            <Link to="/otp-signin" className="underline">Sign In with OTP</Link>
            <Link to="/forgot-password" className="underline">Forgot Password?</Link>
          </div>

          <p className="mt-6 text-sm text-center">
            Don’t have an account?{" "}
            <Link to="/signup" className="font-semibold underline text-[#c29d5f]">
              Sign Up
            </Link>
          </p>

          {message && (
            <p
              className="text-center text-sm mt-4"
              style={{ color: message.includes("✅") ? "green" : "red" }}
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
