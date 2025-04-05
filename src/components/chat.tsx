"use client";
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from '../firebase/firebase';
import "./chat.css";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const db = getDatabase(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList: Message[] = Object.entries(data).map(([id, message]: any) => ({
          id,
          text: message.text,
          createdAt: message.createdAt,
          senderId: message.senderId,
          senderName: message.senderName
        }));
        messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });
  }, [db]);

  const handleSendMessage = () => {
    if (newMessageText.trim() !== '' && user) {
      const postData = {
        text: newMessageText,
        createdAt: new Date().toISOString(),
        senderId: user.uid,
        senderName: user.displayName || "Anonymous"
      };
      push(ref(db, 'messages'), postData);
      setNewMessageText('');
    }
  };

  const handleStartEdit = (messageId: string, messageText: string) => {
    setEditingMessageId(messageId);
    setEditText(messageText);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleUpdateMessage = (messageId: string) => {
    if (editText.trim() !== '') {
      const updates: { [key: string]: any } = {};
      updates['/messages/' + messageId + '/text'] = editText;
      updates['/messages/' + messageId + '/createdAt'] = new Date().toISOString();
      update(ref(db), updates);
      setEditingMessageId(null);
      setEditText('');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    remove(ref(db, 'messages/' + messageId));
  };

  const shouldShowName = (curr: Message, prev?: Message) => {
    if (!prev) return true;
    const timeDiff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return curr.senderId !== prev.senderId || timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Telegram Clone</h2>

      <div className="messages">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : undefined;
          const isCurrentUser = message.senderId === user?.uid;
          const showName = shouldShowName(message, prevMessage);

          return (
            <div key={message.id} className={`message-bubble ${isCurrentUser ? 'own-message' : ''}`}>
              {showName && (
                <div className="message-sender">
                  {isCurrentUser ? "You" : message.senderName}
                </div>
              )}
              {editingMessageId === message.id ? (
                <>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="message-edit-buttons">
                    <button onClick={() => handleUpdateMessage(message.id)}>Update</button>
                    <button onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div>{message.text}</div>
                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isCurrentUser && (
                      <>
                        <button onClick={() => handleStartEdit(message.id, message.text)}>Edit</button>
                        <button onClick={() => handleDeleteMessage(message.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
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
    </div>
  );
}

export default ChatComponent;
