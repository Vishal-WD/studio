// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2OsecuX6gneb0fXvxuar9DiS2OThASxA",
  authDomain: "campus-790a5.firebaseapp.com",
  projectId: "campus-790a5",
  storageBucket: "campus-790a5.firebasestorage.app",
  messagingSenderId: "1099078818680",
  appId: "1:1099078818680:web:8ac2cef262a4517a66c68d",
  measurementId: "G-2ME4PL9RPK"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
