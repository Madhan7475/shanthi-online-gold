import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FiEye, FiEyeOff } from "react-icons/fi";

const SigninPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, identifier, password);
      setError("Signed in successfully");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[65vh] bg-white text-black">
      <form
        onSubmit={handleSignin}
        className="w-full max-w-md bg-white rounded-md border border-gray-200 p-8 shadow-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-2">Sign In</h2>
        <p className="text-sm text-center mb-6 text-gray-500">
          Please sign in to your Shanthi Online Gold.
        </p>

        <label className="block mb-2 text-sm font-medium">Enter Your Mobile Number or Email ID *</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full p-2 border-b-2 border-gray-300 focus:outline-none focus:border-black mb-6"
          required
        />

        <label className="block mb-2 text-sm font-medium">Password *</label>
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border-b-2 border-gray-300 focus:outline-none focus:border-black"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-gray-500"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-6 text-center">
          By clicking on Submit, you are agreeing to our terms & conditions
          and our privacy policy.
        </p>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition"
        >
          SUBMIT
        </button>

        <div className="flex justify-between mt-4 text-sm">
          <Link to="/otp-signin" className="text-black underline">Sign In with OTP</Link>
          <Link to="/forgot-password" className="text-black underline">Forgot Password ?</Link>
        </div>

        <p className="mt-6 text-sm text-center">
          Do not have an account with us?{" "}
          <Link to="/signup" className="text-black font-semibold underline">
            Sign Up
          </Link>
        </p>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}
      </form>
    </div>
  );
};

export default SigninPage;
