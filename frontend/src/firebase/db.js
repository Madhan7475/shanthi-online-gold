// src/firebase/db.js
import { db } from "./config";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const addUserData = async (data) => {
  const docRef = await addDoc(collection(db, "users"), data);
  return docRef.id;
};

export const getUserData = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
