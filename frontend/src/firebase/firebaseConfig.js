// src/firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Initialize Firebase once (supports hot reloads during development)
const firebaseConfig = {
  apiKey: "AIzaSyBRynwv8B-go_6k_x9kiaH_eua-DwSJbHM",
  authDomain: "shanthi-online-gold.firebaseapp.com",
  projectId: "shanthi-online-gold",
  storageBucket: "shanthi-online-gold.appspot.com",
  messagingSenderId: "546694008454",
  appId: "1:546694008454:web:0ada7fdda97eea1bd3cb07",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ✅ Enable test phone numbers (no reCAPTCHA) only on localhost
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  try {
    auth.settings.appVerificationDisabledForTesting = true;
    console.log("⚙️ Firebase test phone number mode enabled");
  } catch (e) {
    console.warn("⚠️ Could not enable test phone number mode:", e);
  }
}

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
