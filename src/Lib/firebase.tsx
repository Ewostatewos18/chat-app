// Import the necessary Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfR0ckqyB0LDlg6HFoM_8ILoTpatIy9zM",
  authDomain: "chat-chat-chat-app.firebaseapp.com",
  projectId: "chat-chat-chat-app",
  storageBucket: "chat-chat-chat-app.firebasestorage.app",
  messagingSenderId: "79648007240",
  appId: "1:79648007240:web:f673d7af032dca9ebe247d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3 provider


// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Export the initialized services
export {app, auth, googleProvider, db };
