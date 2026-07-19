import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase with settings from the configuration file to adapt dynamically
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Determine which Firestore database ID to use based on localStorage preference (defaulting to custom)
const savedDbPreference = localStorage.getItem("crm_firestore_db_type") || "custom";
const customDbId = localStorage.getItem("crm_firestore_db_custom_id") || firebaseConfig.firestoreDatabaseId || "ai-studio-54e6c144-dba7-4ab4-9fdb-0e1ed51236a8";

const databaseId = savedDbPreference === "default" ? "(default)" : customDbId;

// Export the active Firestore database instance
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Initialize Auth
export const auth = getAuth(app);

