"use client";
import { useState, useEffect } from "react";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Login from "./pages/Login";
import Chat from "./components/Chat/chat";
import "./App.css"; // optional for global styles
import Auth from "./components/Auth/Auth";

function App() {
  // Explicitly define the type of `user` as `User | null`
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // `currentUser` is of type `User | null`
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-container">
        {user ? (
          <>
            <button className="signout-button" onClick={() => signOut(auth)}>Sign Out</button>
            <Chat />
          </>
        ) : (
          <Routes>
            <Route path="*" element={<Auth />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
