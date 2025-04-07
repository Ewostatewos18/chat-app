// import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Your custom styles

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;

      // Check if the user is already in the database, if not, create them
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, {
        displayName: user.displayName,
        photoURL: user.photoURL,
        isOnline: true,
        lastSeen: serverTimestamp(),
      });

      // Automatically update user status when they disconnect
      onDisconnect(userRef).update({
        isOnline: false,
        lastSeen: serverTimestamp(),
      });

      // Redirect to the home/chat page after successful login
      navigate('/'); // Go to home/chat page
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <button onClick={handleLogin} className="login-button">
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
