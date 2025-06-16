// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRynwv8B-go_6k_x9kiaH_eua-DwSJbHM",
  authDomain: "shanthi-online-gold.firebaseapp.com",
  projectId: "shanthi-online-gold",
  storageBucket: "shanthi-online-gold.firebasestorage.app",
  messagingSenderId: "546694008454",
  appId: "1:546694008454:web:0ada7fdda97eea1bd3cb07",
  measurementId: "G-1MK59YZH5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, RecaptchaVerifier };