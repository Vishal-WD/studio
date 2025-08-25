// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";

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
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
const getFCMToken = async () => {
    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const messaging = getMessaging(app);
            const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            // Use your VAPID key from the Firebase console
            const currentToken = await getToken(messaging, { 
                vapidKey: "BElRz_q-42j1tVz8ZALkyOq9yD2EdoT6aM7kR_pWqprkL9n28yFEX85dUC1c9B2p2qZf8sA4p2G-gPZf5qZz3zY",
                serviceWorkerRegistration
             });
            if (currentToken) {
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        }
        return null;
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        return null;
    }
};


export { app, auth, db, storage, getFCMToken };