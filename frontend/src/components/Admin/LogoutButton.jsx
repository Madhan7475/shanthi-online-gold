// src/components/Admin/LogoutButton.jsx

import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-500 hover:underline mt-2"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
