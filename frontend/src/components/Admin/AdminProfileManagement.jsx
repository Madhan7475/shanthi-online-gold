import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  UserCheck, 
  UserX, 
  Calendar,
  Mail,
  Phone,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import AdminLayout from '../AdminLayout';

const AdminProfileManagement = () => {
  const [activeTab, setActiveTab] = useState('my-profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // My Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    createdAt: ''
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalAdmins: 0,
    recentUsers: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);

  const API_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
  // API Base URL
  const API_BASE = `${API_HOST}/api`;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('authToken');
  };

  // Fetch admin profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const result = await response.json();
      if (result.success) {
        setProfileData(result.data);
        setProfileForm({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update admin profile
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProfileData(result.data);
        setProfileEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const result = await response.json();
      if (result.success) {
        setUserStats(result.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // Fetch users with pagination and search
  const fetchUsers = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(role && { role })
      });
      
      const response = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const result = await response.json();
      if (result.success) {
        setUsers(result.data.users);
        setCurrentPage(result.data.pagination.current);
        setTotalPages(result.data.pagination.pages);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`User role updated to ${newRole}`);
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers(currentPage, searchTerm, roleFilter);
        fetchUserStats();
        setEditingUser(null);
      } else {
        throw new Error(result.error || 'Role update failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter changes
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, roleFilter);
  };

  const handleReset = () => {
    setSearchTerm('');
    setRoleFilter('');
    setCurrentPage(1);
    fetchUsers(1, '', '');
  };

  // Load data on component mount and tab changes
  useEffect(() => {
    if (activeTab === 'my-profile') {
      fetchProfile();
    } else if (activeTab === 'user-management') {
      fetchUsers();
      fetchUserStats();
    }
  }, [activeTab]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    setProfileForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
        isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
      }`}>
        {isAdmin ? <Shield size={12} /> : <Users size={12} />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-600 mt-2">Manage your profile and user accounts</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-8">
          <button
            onClick={() => setActiveTab('my-profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'my-profile'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Edit3 size={16} />
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('user-management')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'user-management'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users size={16} />
            User Management
          </button>
        </div>

        {/* My Profile Tab */}
        {activeTab === 'my-profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Profile</h2>
              {!profileEditing ? (
                <button
                  onClick={() => setProfileEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setProfileEditing(false);
                      setProfileForm({
                        name: profileData.name || '',
                        email: profileData.email || '',
                        phone: profileData.phone || ''
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  {profileEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Users size={16} />
                      {profileData.name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {profileEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail size={16} />
                      {profileData.email || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {profileEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone size={16} />
                      {profileData.phone || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(profileData.role)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar size={16} />
                    {profileData.createdAt ? formatDate(profileData.createdAt) : 'Not available'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'user-management' && (
          <div className="space-y-6">
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.totalAdmins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">New (7 days)</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.recentUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="admin">Admins</option>
                  </select>
                  
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Filter size={16} />
                    Filter
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw size={16} />
                    Reset
                  </button>
                </div>
              </div>

              {/* Users Table */}
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {user.name || 'Unnamed User'}
                                  </p>
                                  <p className="text-sm text-gray-600">ID: {user._id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {user.email && (
                                  <p className="text-sm text-gray-900 flex items-center gap-1">
                                    <Mail size={12} />
                                    {user.email}
                                  </p>
                                )}
                                {user.phone && (
                                  <p className="text-sm text-gray-900 flex items-center gap-1">
                                    <Phone size={12} />
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getRoleBadge(user.role)}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                            </td>
                            <td className="py-4 px-4">
                              {editingUser === user._id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updateUserRole(user._id, user.role === 'admin' ? 'customer' : 'admin')}
                                    disabled={loading}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Make {user.role === 'admin' ? 'Customer' : 'Admin'}
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingUser(user._id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                                >
                                  <Edit3 size={12} />
                                  Edit Role
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users.length === 0 && (
                    <div className="text-center py-12">
                      <UserX className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No users found</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newPage = currentPage - 1;
                            setCurrentPage(newPage);
                            fetchUsers(newPage, searchTerm, roleFilter);
                          }}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            const newPage = currentPage + 1;
                            setCurrentPage(newPage);
                            fetchUsers(newPage, searchTerm, roleFilter);
                          }}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfileManagement;
