import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("gold");
  const [password, setPassword] = useState("gold123");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "gold" && password === "gold@123") {
      setMessage("✅ Login successful");
      setTimeout(() => {
        navigate("/admin/panel");
      }, 1000);
    } else {
      setMessage("❌ Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[100vh] bg-[#3b004c] text-[#f7c974]">
      <div className="w-full max-w-sm p-[2px] rounded-xl bg-gradient-to-r from-[#5b166b] via-[#8b1d92] to-[#5b166b] shadow-2xl">
        <form onSubmit={handleSubmit} className="w-full bg-[#24002f] rounded-xl p-8">
          <h2 className="text-3xl font-bold text-center text-[#f7c974] mb-2">Admin Login</h2>
          <p className="text-sm text-center mb-6 text-[#ddb97d]">Secure access for administrators</p>

          <label className="block text-sm font-medium mb-1 text-[#f7c974]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 bg-[#3f0c4a] text-white border-b-2 border-[#e8b763] focus:outline-none focus:border-[#f7c974] mb-4 rounded"
          />

          <label className="block text-sm font-medium mb-1 text-[#f7c974]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 bg-[#3f0c4a] text-white border-b-2 border-[#e8b763] focus:outline-none focus:border-[#f7c974] mb-6 rounded"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f7c974] to-[#e8b763] text-[#3b004c] font-semibold py-2 rounded hover:opacity-90 transition"
          >
            LOGIN
          </button>

          {message && (
            <p
              className="text-center text-sm mt-4"
              style={{ color: message.includes("✅") ? "#32cd32" : "#ff4c4c" }}
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
