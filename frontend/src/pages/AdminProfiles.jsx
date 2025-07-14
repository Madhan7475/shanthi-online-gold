import React, { useState } from "react";
import {
  Pencil, Lock, Save, X, Trash2,
  BarChart3, Package, ShoppingCart, Users, FileText, LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const NavItem = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center space-x-3 text-white hover:text-[#f599ff] transition-all">
    {icon}
    <span>{label}</span>
  </Link>
);

const roles = ["Super Admin", "Manager", "Moderator", "Support"];

const AdminProfiles = () => {
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([
    {
      name: "Madhan V",
      email: "admin@shanthigold.com",
      phone: "+91 98765 43210",
      role: "Super Admin",
      avatar: ""
    }
  ]);

  const [editIndex, setEditIndex] = useState(null);
  const [tempProfile, setTempProfile] = useState({});

  const handleEdit = (index) => {
    setEditIndex(index);
    setTempProfile(profiles[index]);
  };

  const handleCancel = () => {
    setEditIndex(null);
    setTempProfile({});
  };

  const handleSave = () => {
    const updated = [...profiles];
    updated[editIndex] = tempProfile;
    setProfiles(updated);
    handleCancel();
  };

  const handleAdd = () => {
    const newProfile = { name: "", email: "", phone: "", role: roles[0], avatar: "" };
    setProfiles([...profiles, newProfile]);
    setEditIndex(profiles.length);
    setTempProfile(newProfile);
  };

  const handleDelete = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this profile?");
    if (confirmDelete) {
      const updated = profiles.filter((_, i) => i !== index);
      setProfiles(updated);
      handleCancel();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const avatarURL = URL.createObjectURL(file);
      setTempProfile({ ...tempProfile, avatar: avatarURL });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-64 bg-[#400F45] border-r-4 border-[#fff2a6] p-6 hidden md:block shadow-xl rounded-tr-2xl rounded-br-2xl">
        <h1 className="text-2xl font-bold mb-8 flex items-center justify-center">
          <img src="/logo.svg" alt="Your Logo" className="h-12 w-auto" />
        </h1>
        <nav className="space-y-10 text-gray-200">
          <NavItem to="/admin/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/admin/products" icon={<Package size={18} />} label="Products" />
          <NavItem to="/admin/orders" icon={<ShoppingCart size={18} />} label="Orders" />
          <NavItem to="/admin/profiles" icon={<Users size={18} />} label="Profiles" />
          <NavItem to="/admin/invoices" icon={<FileText size={18} />} label="Invoices" />
        </nav>
      </aside>

      <main className="flex-1 px-6 py-10 bg-gray-50">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-[#400F45]">Admin Profiles</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdd}
              className="bg-[#400F45] text-white px-4 py-2 rounded-xl hover:bg-[#330d37] flex items-center gap-1 shadow"
            >
              + Add Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 flex items-center gap-2 shadow"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profiles.map((profile, index) => (
            <div key={index} className="bg-white border border-[#d1bfd9] p-6 rounded-2xl shadow-lg relative">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={editIndex === index ? tempProfile.avatar || "/avatar-placeholder.png" : profile.avatar || "/avatar-placeholder.png"}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border border-gray-300 object-cover"
                />
                {editIndex === index && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-sm"
                  />
                )}
              </div>

              {["name", "email", "phone"].map((field) => (
                <div key={field} className="mb-4">
                  <label className="text-sm text-gray-600 capitalize block mb-1">{field}</label>
                  {editIndex === index ? (
                    <input
                      type="text"
                      value={tempProfile[field]}
                      onChange={(e) => setTempProfile({ ...tempProfile, [field]: e.target.value })}
                      className="w-full px-4 py-2 border border-[#ccc] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-lg text-gray-800 font-medium">{profile[field]}</p>
                  )}
                </div>
              ))}

              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">Role / Position</label>
                {editIndex === index ? (
                  <select
                    value={tempProfile.role}
                    onChange={(e) => setTempProfile({ ...tempProfile, role: e.target.value })}
                    className="w-full px-4 py-2 border border-[#ccc] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg text-purple-700 font-semibold">{profile.role}</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                {editIndex === index ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(index)}
                      className="bg-[#400F45] text-white px-4 py-2 rounded-lg hover:bg-[#330d37] flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow-md p-6 rounded-2xl space-y-4 max-w-xl mt-12 border border-[#d1bfd9]">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" /> Change Password
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              className="w-full px-4 py-2 border border-[#ccc] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full px-4 py-2 border border-[#ccc] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-[#ccc] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="mt-2 bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition">
            Update Password
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminProfiles;
