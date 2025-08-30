import React, { useEffect, useState, useRef, useCallback } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import InactivityToast from '../components/Common/InactivityToast';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hydratedFromOtp = useRef(false);
  const navigate = useNavigate();
  const warningToastId = useRef(null);

  const logout = useCallback(async () => {
    // Check for items in cart before logging out and set flag
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (cart.length > 0) {
        localStorage.setItem("hasPendingCart", "true");
      }
    } catch (error) {
      console.error("Could not check cart before logout:", error);
    }

    toast.dismiss();
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("⚠️ Firebase signOut failed:", err.message);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    hydratedFromOtp.current = false;
    setUser(null);
    setToken(null);
    navigate("/signin");
  }, [navigate]);

  // AUTO-LOGOUT LOGIC
  useEffect(() => {
    let warningTimer;
    let logoutTimer;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      if (warningToastId.current) {
        toast.dismiss(warningToastId.current);
      }

      if (!localStorage.getItem("token")) {
        return;
      }

      const warningTimeout = 14 * 60 * 1000;
      const finalTimeout = 15 * 60 * 1000;

      warningTimer = setTimeout(() => {
        warningToastId.current = toast.warn(
          <InactivityToast onStayLoggedIn={resetTimers} />,
          {
            toastId: 'inactivity-warning',
            autoClose: finalTimeout - warningTimeout,
            closeOnClick: false,
            draggable: false,
            pauseOnHover: true,
            closeButton: false,
          }
        );
      }, warningTimeout);

      logoutTimer = setTimeout(() => {
        logout();
      }, finalTimeout);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimers);
    });

    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
    };
  }, [logout]);


  // Effect for hydrating from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        hydratedFromOtp.current = true;
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // This effect now only manages the user state
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken(true);
          const userObj = {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            uid: firebaseUser.uid,
          };

          localStorage.setItem("user", JSON.stringify(userObj));
          localStorage.setItem("token", freshToken);
          setUser(userObj);
          setToken(freshToken);
          hydratedFromOtp.current = false;
        } catch (err) {
          console.error("❌ Failed to get Firebase token:", err);
        }
      } else {
        if (!hydratedFromOtp.current) {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          hydratedFromOtp.current = true;
        } catch (err) {
          // handle error
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const forceHydrate = () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        hydratedFromOtp.current = true;
      } catch (err) {
        // handle error
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        logout,
        loading,
        forceHydrate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
