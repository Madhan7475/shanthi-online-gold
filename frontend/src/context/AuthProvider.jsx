import React, { useEffect, useState, useRef } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hydratedFromOtp = useRef(false); // ✅ Track OTP-based login
   const navigate = useNavigate(); 

  // 🔃 1. Hydrate from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        hydratedFromOtp.current = true; // ✅ Set flag
        console.log("✅ [AuthProvider] Hydrated from localStorage:", parsedUser);
      } catch (err) {
        console.error("❌ Failed to parse localStorage:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  // 🔄 2. Listen for Firebase login/logout changes
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      console.log("🔄 Firebase auth state changed:", firebaseUser);

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
          hydratedFromOtp.current = false; // ✅ Firebase takes control
          console.log("✅ [AuthProvider] Logged in via Firebase:", userObj);
        } catch (err) {
          console.error("❌ Failed to get Firebase token:", err);
        }
      } else {
        if (!hydratedFromOtp.current) {
          // 🛑 Only wipe state if not OTP-based
          console.log("🚫 [AuthProvider] Firebase user is null and not OTP — clearing auth");
          setUser(null);
          setToken(null);
        } else {
          console.log("🟡 [AuthProvider] Ignoring Firebase null, OTP login active");
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔁 3. Sync if storage changes from other tabs
  useEffect(() => {
    const syncFromStorage = () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          hydratedFromOtp.current = true;
          console.log("🔁 Synced AuthProvider from another tab");
        } catch (err) {
          console.error("❌ Storage sync failed:", err);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  // 🔁 Manual force hydrate (used after OTP login)
  const forceHydrate = () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        hydratedFromOtp.current = true;
        console.log("✅ Forced rehydrate of AuthProvider");
      } catch (err) {
        console.error("❌ Failed to force hydrate:", err);
      }
    }
  };

  const logout = async () => {
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        logout,
        loading,
        forceHydrate, // ✅ expose to context consumers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
