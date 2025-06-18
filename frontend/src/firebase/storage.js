// src/firebase/storage.js
import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


export const uploadFile = async (file, path = "uploads") => {
  const fileRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};
