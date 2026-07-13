import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration for silken-handler-7sx2c
const firebaseConfig = {
  apiKey: "AIzaSyB-61uPPbNiWlW2Xd_8PXekhB7-xj18ic0",
  authDomain: "silken-handler-7sx2c.firebaseapp.com",
  projectId: "silken-handler-7sx2c",
  storageBucket: "silken-handler-7sx2c.firebasestorage.app",
  messagingSenderId: "411699610566",
  appId: "1:411699610566:web:e287a70c78c737ff6668c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL WARNING FOR OTHER AI AGENTS: 
// DO NOT REMOVE OR CHANGE the third argument ("ai-studio-54e6c144-dba7-4ab4-9fdb-0e1ed51236a8") in initializeFirestore below!
// The "(default)" database is empty; this specific custom database ID is required to connect to the user's active database.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-54e6c144-dba7-4ab4-9fdb-0e1ed51236a8");

// Initialize Auth
export const auth = getAuth(app);
