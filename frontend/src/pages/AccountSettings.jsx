import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";
import DeleteAccountModal from "../components/Account/DeleteAccountModal";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiTrash2, 
  FiShield, 
  FiClock,
  FiSettings
} from "react-icons/fi";

const AccountSettings = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }
    
    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/users/me");
      setUserProfile(response.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      toast.error("Failed to load profile information");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const onDeleteSuccess = () => {
    setShowDeleteModal(false);
    toast.success("Account deleted successfully");
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#400F45] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9e8] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#400F45] flex items-center gap-3">
            <FiSettings className="h-8 w-8" />
            Account Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#400F45] to-[#5a1a5f] text-white">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FiUser className="h-5 w-5" />
                  Profile Information
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Name */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FiUser className="h-6 w-6 text-[#400F45]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.name || user?.name || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FiMail className="h-6 w-6 text-[#400F45]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.email || user?.email || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FiPhone className="h-6 w-6 text-[#400F45]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Account Type */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FiShield className="h-6 w-6 text-[#400F45]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <p className="text-gray-900 font-medium capitalize">
                      {userProfile?.role || "Customer"}
                    </p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <FiClock className="h-6 w-6 text-[#400F45]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userProfile?.createdAt 
                        ? new Date(userProfile.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Not available"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#400F45] to-[#5a1a5f] text-white">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <button
                  onClick={() => navigate("/my-orders")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    📦
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">View Orders</h4>
                    <p className="text-sm text-gray-500">Check your order history</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/saved-items")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    💖
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Wishlist</h4>
                    <p className="text-sm text-gray-500">Manage saved items</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    🛒
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Shopping Cart</h4>
                    <p className="text-sm text-gray-500">View cart items</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiShield className="h-5 w-5" />
                  Danger Zone
                </h3>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 mb-4">
                    <li>• All personal data will be permanently removed</li>
                    <li>• Order history will be anonymized for records</li>
                    <li>• Wishlist and cart items will be deleted</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={onDeleteSuccess}
        />
      )}
    </div>
  );
};

export default AccountSettings;