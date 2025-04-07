"use client";
import React, { useEffect, useState } from "react";
import Auth from "./Auth/Auth";
import Chat from "./Chat/chat";
import { getAuth } from "firebase/auth";
import { app } from "../firebase/firebase";

const ChatRoom = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true); // User is authenticated
      } else {
        setIsAuthenticated(false); // User is not authenticated
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <div>
      {isAuthenticated ? <Chat /> : <Auth />}
    </div>
  );
};

export default ChatRoom;
