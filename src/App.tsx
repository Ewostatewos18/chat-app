"use client";
import { useState, useEffect } from "react";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Chat from "./components/Chat/chat";
import "./App.css";
import Login from "./components/Auth/Login";

// A wrapper to access navigation outside Router
const AuthenticatedApp = ({ user }: { user: User }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);

    get(userRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // User was deleted from database, force logout
        signOut(auth).then(() => {
          navigate("/login");
        });
      }
    });
  }, [user, navigate]);

  return <Chat />;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // wait for auth to resolve

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-container">
        {authChecked ? (
          user ? (
            <Routes>
              <Route path="*" element={<AuthenticatedApp user={user} />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="*" element={<Login />} />
            </Routes>
          )
        ) : null}
      </div>
    </Router>
  );
}

export default App;
