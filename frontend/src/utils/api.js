import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth headers for admin requests
export const getAuthHeaders = () => {
  // Prefer Firebase ID token if present, else OTP JWT, else legacy admin token
  const token =
    localStorage.getItem('token') ||          // Firebase ID token (from onIdTokenChanged)
    localStorage.getItem('otpUserToken') ||   // Backend-issued JWT from OTP/password flow
    localStorage.getItem('adminToken');       // Legacy/admin password login
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Admin API calls
export const adminAPI = {
  // Products
  getProducts: () => api.get('/api/products'),

  getProduct: (id) => api.get(`/api/products/${id}`),

  createProduct: (formData) =>
    api.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    }),

  updateProduct: (id, formData) =>
    api.put(`/api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders()
      }
    }),

  deleteProduct: (id) =>
    api.delete(`/api/products/${id}`, {
      headers: getAuthHeaders()
    }),
};

export default api;
