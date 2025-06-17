import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import this

const AdminLogin = () => {
  const [username, setUsername] = useState("gold");
  const [password, setPassword] = useState("gold123");
  const [message, setMessage] = useState("");

  const navigate = useNavigate(); // ✅ useNavigate hook

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === "gold" && password === "gold123") {
      setMessage("✅ Login successful");
      setTimeout(() => {
        navigate("/admin/panel"); // ✅ redirect after successful login
      }, 1000); // optional delay to show message
    } else {
      setMessage("❌ Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] bg-[#fffdf6] text-[#3e2f1c]">
      <div className="w-full max-w-sm p-[2px] rounded-xl bg-gradient-to-r from-[#f4d88d] via-[#ffd700] to-[#f4d88d] shadow-xl">
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-xl p-8">
          <h2 className="text-3xl font-semibold text-center text-[#d4af37] mb-2">Admin</h2>
          <p className="text-sm text-center mb-6 text-[#8a7653]">
            Secure access for administrators
          </p>

          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] mb-4"
          />

          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none focus:border-[#c29d5f] mb-6"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-black py-2 rounded hover:opacity-90 transition font-semibold"
          >
            LOGIN
          </button>

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

export default AdminLogin;
