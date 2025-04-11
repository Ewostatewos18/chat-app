"use client";
import { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
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
import { HiEye, HiEyeOff } from 'react-icons/hi';

const Login = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await completeLogin(result.user);
    } catch (error: unknown) {
      setError(error instanceof Error ? 'Failed to sign in with Google: ' + error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPasswordLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await completeLogin(result.user);
    } catch (error: unknown) {
      setError(error instanceof Error ? 'Incorrect email or password: ' + error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPasswordRegister = async () => {
    setError(null);
    if (!email || !password || !username) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: username });
      await completeLogin(result.user, username);
    } catch (error: unknown) {
      setError(error instanceof Error ? 'Failed to register: ' + error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeLogin = async (user: User, username?: string) => {
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

    navigate('/');
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

        <div className="mb-5 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={isLogin ? handleEmailPasswordLogin : handleEmailPasswordRegister}
          disabled={isSubmitting}
          className={`w-full text-white py-3 rounded-lg font-medium transition duration-300 ${
            isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-3 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition duration-300 disabled:opacity-60"
        >
          <FcGoogle size={22} />
          Sign in with Google
        </button>

        <p className="mt-6 text-sm text-center text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <span
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
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
