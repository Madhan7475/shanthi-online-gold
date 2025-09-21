import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const CartAuthGuard = ({ children, fallback = null }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-[#c29d5f]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#f4e0b9] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#c29d5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#3e2f1c] mb-2">Sign in Required</h3>
          <p className="text-[#8a7653] mb-6">
            Please sign in to view and manage your cart items.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full bg-gradient-to-r from-[#f4c57c] to-[#ffdc9a] text-[#3e2f1c] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            to="/"
            className="block w-full border border-[#c29d5f] text-[#c29d5f] font-medium py-3 px-6 rounded-lg hover:bg-[#fdf5e9] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default CartAuthGuard;
