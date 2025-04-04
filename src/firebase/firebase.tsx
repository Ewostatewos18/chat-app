// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);