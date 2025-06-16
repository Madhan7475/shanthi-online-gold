import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("Signed in!");
    } catch {
      setError("Invalid credentials");
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Google sign-in failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-yellow-50">
      <form onSubmit={handleSignin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-800">Sign In</h2>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded mb-4" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded mb-6" required />

        <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded">Sign In</button>
        <button type="button" onClick={handleGoogle} className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Sign in with Google
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <p className="mt-4 text-sm text-center">Don't have an account? <Link to="/signup" className="text-yellow-600 font-medium">Sign Up</Link></p>
      </form>
    </div>
  );
};

export default SigninPage;
