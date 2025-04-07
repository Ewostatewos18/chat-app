"use client";
import { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebase";
import "./auth.css";  // Optional for additional styles

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="auth-container">
      {user ? (
        <div className="signed-in">
          <p>Welcome, {user.displayName}!</p>
          <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div className="signin">
          <button className="signin-button" onClick={handleGoogleSignIn}>Sign In with Google</button>
        </div>
      )}
    </div>
  );
};

export default Auth;
