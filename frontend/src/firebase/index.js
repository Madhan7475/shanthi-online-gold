// src/firebase/index.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBRynwv8B-go_6k_x9kiaH_eua-DwSJbHM",
  authDomain: "shanthi-online-gold.firebaseapp.com",
  projectId: "shanthi-online-gold",
  storageBucket: "shanthi-online-gold.appspot.com", // ✅ fixed domain
  messagingSenderId: "546694008454",
  appId: "1:546694008454:web:0ada7fdda97eea1bd3cb07",
  measurementId: "G-1MK59YZH5D"
};

// ✅ Initialize Firebase services only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export individually — no `export *`
export { app, auth, db, storage };
