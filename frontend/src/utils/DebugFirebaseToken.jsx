// src/utils/DebugFirebaseToken.jsx
import React, { useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";

const DebugFirebaseToken = () => {
  useEffect(() => {
    const checkToken = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        console.log("🔥 Firebase ID Token:", token);
      } else {
        console.warn("🚫 No Firebase user logged in.");
      }
    };

    checkToken();
  }, []);

  return null; // just for debugging
};

export default DebugFirebaseToken;
