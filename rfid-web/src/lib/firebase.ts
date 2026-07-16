import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPxk-FI1hYo3CrACV9NHl7uDgqcxVpHfM",
  authDomain: "identificacion-alumnos-rfid.firebaseapp.com",
  projectId: "identificacion-alumnos-rfid",
  storageBucket: "identificacion-alumnos-rfid.firebasestorage.app",
  messagingSenderId: "204674907895",
  appId: "1:204674907895:web:a5f920c606e6e2d6821df2"
};

// Initialize Firebase (only once to prevent duplicate app errors in Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Secondary App for user creation (prevents current user from logging out)
const secondaryApp = getApps().find(a => a.name === 'SecondaryApp') 
  || initializeApp(firebaseConfig, 'SecondaryApp');

// Export instances of Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
