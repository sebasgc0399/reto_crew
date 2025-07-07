import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "retocrew-13f3c.firebaseapp.com",
  projectId: "retocrew-13f3c",
  storageBucket: "retocrew-13f3c.firebasestorage.app",
  messagingSenderId: "498350997969",
  appId: "1:498350997969:web:45b39afbe1e76ac01b20f0",
  measurementId: "G-B03LTL8BWZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
