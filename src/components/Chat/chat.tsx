"use client";
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, push, onChildAdded, onChildChanged, onChildRemoved, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from "../../firebase/firebase";
import UserList from '../UserList';  // Assuming UserList is a child component where users are displayed
import './chat.css';

// Define User and UserData types
interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isOnline: boolean;
}

interface UserData {
  displayName: string;
  photoURL: string | null;
  isOnline: boolean;
}

interface Message {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

const ChatComponent = () => {
  
  const [users, setUsers] = useState<User[]>([]);  // Declare setUsers to update the users state
  {users.map((user) => (
    <div key={user.uid}>{user.displayName}</div>
  ))}
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const db = getDatabase(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  // Fetch users from Firebase
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onChildAdded(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data && user) {
        const userList = Object.entries(data).map(([uid, userData]: [string, unknown]) => {
          const typedUserData = userData as UserData;
          return { uid, ...typedUserData };
        });

        // Filter out the current user
        setUsers(userList.filter((u) => u.uid !== user.uid)); 
      }
    });
  }, [db, user]);

  // Generate consistent chat ID between two users
  const generateChatId = (receiverId: string) => {
    if (!user) return "";
    return user.uid < receiverId ? `${user.uid}_${receiverId}` : `${receiverId}_${user.uid}`;
  };

  // Handle user selection to start chat
  const handleSelectUser = (receiver: User) => {
    const chatId = generateChatId(receiver.uid);
    setCurrentChatId(chatId);
    setSelectedUser(receiver);
    fetchMessages(chatId);
  };

  // Fetch messages for the selected chat
  const fetchMessages = (chatId: string) => {
    const messagesRef = ref(db, `chats/${chatId}`);
    onChildAdded(messagesRef, (snapshot) => {
      const message = snapshot.val();
      const newMessage: Message = {
        id: snapshot.key!,
        text: message.text,
        createdAt: message.createdAt,
        senderId: message.senderId,
        senderName: message.senderName,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    onChildChanged(messagesRef, (snapshot) => {
      const updatedMessage = snapshot.val();
      const updatedMessageData: Message = {
        id: snapshot.key!,
        text: updatedMessage.text,
        createdAt: updatedMessage.createdAt,
        senderId: updatedMessage.senderId,
        senderName: updatedMessage.senderName,
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === updatedMessageData.id ? updatedMessageData : msg))
      );
    });

    onChildRemoved(messagesRef, (snapshot) => {
      const removedMessageId = snapshot.key!;
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== removedMessageId));
    });
  };

  const handleSendMessage = () => {
    if (newMessageText.trim() !== "" && user && currentChatId) {
      const postData = {
        text: newMessageText,
        createdAt: new Date().toISOString(),
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
      };
      push(ref(db, `chats/${currentChatId}`), postData);
      setNewMessageText("");
    }
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditText(text);
  };

  const handleUpdateMessage = (id: string) => {
    if (editText.trim() !== "") {
      update(ref(db, `/chats/${currentChatId}/${id}`), {
        text: editText,
        createdAt: new Date().toISOString(),
      });
      setEditingMessageId(null);
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDeleteMessage = (id: string) => {
    remove(ref(db, `/chats/${currentChatId}/${id}`));
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Chat App</h2>

      {/* Pass users array to UserList component */}
      <UserList onSelectUser={handleSelectUser} />


      {selectedUser && (
        <>
          <h3 className="chat-with">Chatting with: {selectedUser.displayName}</h3>

          <div className="messages">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isCurrentUser = message.senderId === user?.uid;
                return (
                  <div key={message.id} className={`message-bubble ${isCurrentUser ? "own-message" : "other-message"}`}>
                    <div className="message-sender">
                      {isCurrentUser ? "You" : message.senderName}
                    </div>
                    <div>{message.text}</div>
                    <div className="message-time">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {isCurrentUser && (
                      <>
                        <button onClick={() => handleStartEdit(message.id, message.text)}>Edit</button>
                        <button onClick={() => handleDeleteMessage(message.id)}>Delete</button>
                      </>
                    )}
                    {editingMessageId === message.id && (
                      <div>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <button onClick={() => handleUpdateMessage(message.id)}>Save</button>
                        <button onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No messages yet</p>
            )}
          </div>

          <div className="input-section">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatComponent;
