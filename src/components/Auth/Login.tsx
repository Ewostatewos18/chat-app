"use client";
import { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { updateProfile } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      handleUserData(user);
      navigate('/');
    } catch (error: unknown) {
      setError(error instanceof Error ? 'Failed to sign in with Google: ' + error.message : 'An unknown error occurred.');
    }
  };

  const handleEmailPasswordLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      handleUserData(user);
      navigate('/');
    } catch (error: unknown) {
      setError(error instanceof Error ? 'Incorrect email or password: ' + error.message : 'An unknown error occurred.');
    }
  };



const handleEmailPasswordRegister = async () => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    await updateProfile(user, {
      displayName: username,
    });
    await handleUserData(user, username);
    navigate('/');
  } catch (error: unknown) {
    setError(error instanceof Error ? 'Failed to register: ' + error.message : 'An unknown error occurred.');
  }  
};


  const handleUserData = async (user: any, username?: string) => {
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      displayName: username || user.displayName,
      email: user.email, 
      photoURL: user.photoURL,
      isOnline: true,
      lastSeen: serverTimestamp(),
    });
  
    onDisconnect(userRef).update({
      isOnline: false,
      lastSeen: serverTimestamp(),
    });
  };
  
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="w-full max-w-lg p-10 bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
       <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? 'Login' : 'Create Your Account'}
        </h2>

        {!isLogin && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={isLogin ? handleEmailPasswordLogin : handleEmailPasswordRegister}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-3 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition duration-300"
        >
          <FcGoogle size={22} />
          Sign in with Google
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <span
                onClick={() => setIsLogin(false)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                onClick={() => setIsLogin(true)}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
