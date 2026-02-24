// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD8iR4iurZlYjVO7TuaxYFnp-ZiVslY0E0",
  authDomain: "institution-portal.firebaseapp.com",
  projectId: "institution-portal",
  storageBucket: "institution-portal.firebasestorage.app",
  messagingSenderId: "401202457232",
  appId: "1:401202457232:web:9112a4f4d930b4f0764615",
  measurementId: "G-NV7ZTVYKMY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
