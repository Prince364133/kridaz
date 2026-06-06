import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCw1nodfsbj1w6gyDNsiwDl87A818cgN0Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grounds-booking-dc802.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grounds-booking-dc802",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grounds-booking-dc802.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9445008437",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9445008437:web:b74d5a2d9f6ad5d9a57d7c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B9WRH0Q80T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
