// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // optional, if needed
import { getFirestore } from "firebase/firestore"; // optional, if needed

const firebaseConfig = {
  apiKey: "AIzaSyBRynwv8B-go_6k_x9kiaH_eua-DwSJbHM",
  authDomain: "shanthi-online-gold.firebaseapp.com",
  projectId: "shanthi-online-gold",
  storageBucket: "shanthi-online-gold.appspot.com", // ✅ fixed ".com"
  messagingSenderId: "546694008454",
  appId: "1:546694008454:web:0ada7fdda97eea1bd3cb07",
  measurementId: "G-1MK59YZH5D",
};

// ✅ Initialize once and export
const app = initializeApp(firebaseConfig);
export { app }; // ✅ Export 'app'

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
