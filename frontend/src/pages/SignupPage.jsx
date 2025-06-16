import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, RecaptchaVerifier } from "../firebase";
import { createUserWithEmailAndPassword, signInWithPhoneNumber } from "firebase/auth";

const SignupPage = () => {
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", password: "", confirm: "" });
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");

  const handleInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendOtp = async () => {
    if (!form.phone.match(/^[6-9]\d{9}$/)) return setError("Invalid phone number");

    window.recaptchaVerifier = new RecaptchaVerifier("recaptcha-container", { size: "invisible" }, auth);
    try {
      const result = await signInWithPhoneNumber(auth, `+91${form.phone}`, window.recaptchaVerifier);
      setConfirmation(result);
      setError("OTP sent!");
    } catch (err) {
    console.error("An error occurred:", err);
    setError("Something went wrong. Please try again.");
}
  };

  const verifyOtp = async () => {
    try {
      await confirmation.confirm(otp);
      // Now create account using email/password
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      setError("Signup successful");
    } catch {
      setError("Invalid OTP or signup failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-yellow-50">
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-yellow-800">Create Account</h2>

        <input name="name" onChange={handleInput} placeholder="Full Name" className="w-full p-2 border rounded mb-2" />
        <input name="phone" onChange={handleInput} placeholder="Phone Number" className="w-full p-2 border rounded mb-2" />
        <input name="address" onChange={handleInput} placeholder="Address" className="w-full p-2 border rounded mb-2" />
        <input name="email" onChange={handleInput} placeholder="Email" className="w-full p-2 border rounded mb-2" />
        <input name="password" onChange={handleInput} placeholder="Password" type="password" className="w-full p-2 border rounded mb-2" />
        <input name="confirm" onChange={handleInput} placeholder="Confirm Password" type="password" className="w-full p-2 border rounded mb-4" />

        {!confirmation ? (
          <button onClick={sendOtp} type="button" className="bg-yellow-600 w-full text-white p-2 rounded">Send OTP</button>
        ) : (
          <>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="w-full p-2 border rounded mb-2" />
            <button onClick={verifyOtp} type="button" className="bg-yellow-700 w-full text-white p-2 rounded">Verify OTP & Sign Up</button>
          </>
        )}

        <div id="recaptcha-container" className="mt-2"></div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="mt-4 text-sm text-center">Already have an account? <Link to="/signin" className="text-yellow-600">Sign In</Link></p>
      </form>
    </div>
  );
};

export default SignupPage;
