"use client";
import { useState } from "react";
import { auth, googleProvider } from "./firebase/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import ChatRoom from "./components/ChatRoom";

function App() {
  const [user, setUser] = useState(auth.currentUser);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <>
          <button onClick={handleSignOut}>Sign Out</button>
          <ChatRoom />
        </>
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
        
      )}
    </div>
  );
}

export default App;
