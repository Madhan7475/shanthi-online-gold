import React, { useState } from "react";
import { Pencil, Lock, Save, X } from "lucide-react";

const roles = ["Super Admin", "Manager", "Moderator", "Support"];

const AdminProfiles = () => {
  const [profile, setProfile] = useState({
    name: "Madhan V",
    email: "admin@shanthigold.com",
    phone: "+91 98765 43210",
    role: "Super Admin",
  });

  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  const handleEdit = () => {
    setTempProfile(profile);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setTempProfile(profile);
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setEditMode(false);
  };

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800">👤 Admin Profile</h1>
        {!editMode ? (
          <button
            onClick={handleEdit}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="space-x-3">
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
          </div>
        )}
      </div>

      <div className="bg-white shadow-md p-6 rounded-xl space-y-6 max-w-xl">
        {/* Name */}
        <div>
          <label className="text-sm text-gray-600">Name</label>
          {editMode ? (
            <input
              type="text"
              value={tempProfile.name}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, name: e.target.value })
              }
              className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <p className="text-lg text-gray-800 font-medium">{profile.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-gray-600">Email</label>
          {editMode ? (
            <input
              type="email"
              value={tempProfile.email}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, email: e.target.value })
              }
              className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <p className="text-lg text-gray-800 font-medium">{profile.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm text-gray-600">Phone</label>
          {editMode ? (
            <input
              type="text"
              value={tempProfile.phone}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, phone: e.target.value })
              }
              className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <p className="text-lg text-gray-800 font-medium">{profile.phone}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="text-sm text-gray-600">Role / Position</label>
          {editMode ? (
            <select
              value={tempProfile.role}
              onChange={(e) =>
                setTempProfile({ ...tempProfile, role: e.target.value })
              }
              className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-lg text-purple-700 font-semibold">
              {profile.role}
            </p>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-md p-6 rounded-xl space-y-4 max-w-xl mt-10">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-600" /> Change Password
        </h3>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="New password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button className="mt-2 bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 transition">
          Update Password
        </button>
      </div>
    </div>
  );
};

export default AdminProfiles;
