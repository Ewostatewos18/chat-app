"use client";
import React, { useState, useEffect } from "react";
import { auth } from "./firebase/firebase"; // Import Firebase auth
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./components/Auth"; // Your login component
import Chat from "./components/chat"; // Your chat component

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <button onClick={() => signOut(auth)}>Sign Out</button>
          <Chat />
        </div>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;
