"use client";
import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Custom styles

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  // State for email, password, and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Set initial error to null

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      handleUserData(user);
      navigate('/'); // Go to home/chat page
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError('Failed to sign in with Google: ' + error.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  // Handle email and password login
  const handleEmailPasswordLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      handleUserData(user);
      navigate('/'); // Go to home/chat page
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError('Incorrect email or password: ' + error.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  // Save user data to Firebase
  const handleUserData = async (user: any) => {
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
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      <div className="input-group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
      </div>
      <div className="input-group">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
      </div>

      {error && <p className="error-message">{error}</p>} {/* Display error message */}

      <button onClick={handleEmailPasswordLogin} className="login-button">
        Sign in with Email
      </button>

      <div className="divider">
        <span>OR</span>
      </div>

      <button onClick={handleGoogleLogin} className="login-button google-button">
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
