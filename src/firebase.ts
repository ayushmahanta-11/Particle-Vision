// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// ▼▼▼ PASTE YOUR FIREBASE CONFIG OBJECT HERE ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyBxOsmbTQUpfdfZVKIC_tUPlr7tRwOJCAA",
  authDomain: "particlevision-edb05.firebaseapp.com",
  projectId: "particlevision-edb05",
  storageBucket: "particlevision-edb05.firebasestorage.app",
  messagingSenderId: "122301103403",
  appId: "1:122301103403:web:5f629efe9280c7b944596e",
  measurementId: "G-QGW5X9N4WQ"
};
// ▲▲▲ END OF CONFIG ▲▲▲

// Initialize Firebase and export the services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Be sure to get the functions from the correct region if not us-central1
export const storage = getStorage(app);