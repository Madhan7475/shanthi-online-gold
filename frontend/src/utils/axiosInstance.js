// src/utils/axiosInstance.js
import axios from "axios";

const baseURL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:9000"}/api`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Automatically attach token from localStorage to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
