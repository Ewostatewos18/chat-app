"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  timestamp?: Timestamp | null;
};

const ChatRoom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message)));
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    if (!auth.currentUser) return alert("Please sign in to send messages");

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName,
        timestamp: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.uid === auth.currentUser?.uid ? "sent" : "received"}`}>
            <p>
              <strong>{msg.displayName}:</strong> {msg.text}
            </p>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatRoom;
