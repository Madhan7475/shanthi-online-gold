import { useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Auto-set credentials since fields are hidden
    setEmail("admin@shanthionlinegold.com");
    setPassword("admin123");

    setTimeout(() => {
      localStorage.setItem("isAdminAuthenticated", "true");
      toast.success("✅ Login successful!", {
        position: "top-center",
        autoClose: 1800,
        theme: "colored",
      });
      setShowWelcome(true);
      setTimeout(() => navigate("/admin/products"), 2000);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-[#faf5fb] overflow-hidden">
      {/* Background pattern with vignette */}
      <div
        className="absolute inset-0 bg-[url('/logo_admin.svg')] bg-repeat opacity-5 z-0"
        style={{ backgroundSize: "100px" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#00000033] via-transparent to-[#00000055] z-0 pointer-events-none" />

      {/* Logo */}
      <motion.img
        src="/logo_admin.svg"
        alt="Shanthi Gold Logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="w-40 h-auto mb-6 z-10"
      />

      {/* Animate Content */}
      <AnimatePresence mode="wait">
        {!showWelcome ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10 bg-white bg-opacity-90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-[#eaddea] w-full max-w-md"
          >
            <h2 className="text-3xl font-bold text-center text-[#400F45] mb-6">
              Admin Login
            </h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#400F45] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2 border border-[#d6c3e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#400F45] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-[#d6c3e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#400F45] transition"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-[#400F45] text-white py-2 rounded-lg shadow-md hover:bg-[#330d37] transition disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Login"}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10 text-center text-[#400F45] text-xl font-semibold bg-white bg-opacity-90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-[#eaddea]"
          >
            Welcome back, Admin!
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
};

export default AdminLogin;
