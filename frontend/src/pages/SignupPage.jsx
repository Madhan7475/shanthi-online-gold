import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const validate = () => {
    const { name, email, phone, password } = formData;
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    else if (name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Invalid email format";

    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(phone)) newErrors.phone = "Invalid Indian phone number";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post("http://localhost:9000/api/users/register", formData);
      setMessage(res.data.message || "✅ Registered successfully!");
      setFormData({ name: "", email: "", phone: "", password: "" });
      setErrors({});
    } catch (error) {
      setMessage(error.response?.data?.error || "❌ Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] bg-[#fff9e8] text-[#3b3b3b]">
      <div className="w-full max-w-md p-[2px] rounded-xl bg-gradient-to-r from-[#f4d88d] via-[#ffd700] to-[#f4d88d] shadow-lg">
        <form className="bg-white rounded-xl p-6" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold text-center text-[#d4af37] mb-4">Sign Up</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none text-left"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none text-left"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit Mobile Number"
              className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none text-left"
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create Password"
              className="w-full p-2 border-b-2 border-[#e2c17b] focus:outline-none text-left"
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-black py-2 rounded hover:opacity-90 transition font-semibold"
          >
            REGISTER
          </button>

          {message && (
            <p
              className="text-center text-sm mt-4"
              style={{ color: message.includes("✅") ? "green" : "red" }}
            >
              {message}
            </p>
          )}

          <div className="mt-5 text-center text-sm text-[#8a7653]">
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
