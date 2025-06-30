import React, { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

const AdminAuth = () => {
  const [admins, setAdmins] = useState([
    {
      id: 1,
      name: "Madhan V",
      email: "admin@shanthigold.com",
      role: "Super Admin",
    },
    {
      id: 2,
      name: "Suresh Kumar",
      email: "manager@shanthigold.com",
      role: "Manager",
    },
  ]);

  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", role: "" });
  const [editingId, setEditingId] = useState(null);

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.role) return;
    setAdmins([
      ...admins,
      { ...newAdmin, id: Date.now() },
    ]);
    setNewAdmin({ name: "", email: "", role: "" });
  };

  const handleDelete = (id) => {
    setAdmins(admins.filter((admin) => admin.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
    const current = admins.find((a) => a.id === id);
    setNewAdmin(current);
  };

  const handleUpdate = () => {
    setAdmins(admins.map((admin) => (admin.id === editingId ? newAdmin : admin)));
    setNewAdmin({ name: "", email: "", role: "" });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-purple-800">🛡️ Admin Access Management</h1>
        <span className="text-sm text-gray-500">
          {editingId ? "Editing Profile" : "Add New Profile"}
        </span>
      </div>

      {/* Create/Edit Form */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto mb-10">
        <h2 className="text-lg font-semibold mb-4 text-purple-700">
          {editingId ? "Edit Admin" : "Create New Admin"}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={newAdmin.name}
            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Role (e.g., Manager, Support)"
            value={newAdmin.role}
            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {editingId ? (
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700"
            >
              Update Profile
            </button>
          ) : (
            <button
              onClick={handleAddAdmin}
              className="bg-purple-600 text-white w-full py-2 rounded-md hover:bg-purple-700"
            >
              <Plus className="inline w-4 h-4 mr-2" />
              Create Profile
            </button>
          )}
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-purple-700 mb-4">Admin Profiles</h2>
        <ul className="divide-y divide-gray-200">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="py-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{admin.name}</p>
                <p className="text-sm text-gray-500">{admin.email} • {admin.role}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(admin.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(admin.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminAuth;
