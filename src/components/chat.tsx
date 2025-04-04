"use client";
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, onValue, update } from "firebase/database";
import {app} from '../firebase/firebase'; // Your Firebase initialization file
import "./chat.css";
interface Message {
    id: string;
    text: string;
    createdAt: string;
}

function ChatComponent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const db = getDatabase(app); // Get the database instance

    useEffect(() => {
        const messagesRef = ref(db, 'messages'); // Reference to the 'messages' node

        // Listen for changes to the data at the messagesRef
        onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert the object of messages into an array
                const messagesList: Message[] = Object.entries(data).map(([id, message]) => ({
                    id,
                    text: message.text,
                    createdAt: message.createdAt,
                }));

                // Sort messages by timestamp (newest first)
                messagesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setMessages(messagesList);
            } else {
                setMessages([]);
            }
        });
    }, [db]);

    const handleSendMessage = () => {
        if (newMessageText.trim() !== '') {
            // A post entry.
            const postData = {
                text: newMessageText,
                createdAt: new Date().toISOString()
            };

            // Get a key for a new Post.
            const newPostKey = push(ref(db, 'messages'), postData).key;

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
            updates['/messages/' + messageId] = {
                text: editText,
                createdAt: new Date().toISOString()
            };

            update(ref(db), updates);
            setEditingMessageId(null);
            setEditText('');
        }
    };

    return (
        <div className="chat-container">
            <h2 className="chat-title">Telegram Clone</h2>
    
            <div className="messages">
                {messages.map((message) => (
                    <div key={message.id} className="message-bubble">
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
                                    <button
                                        onClick={() => handleStartEdit(message.id, message.text)}
                                        style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#007bb5', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
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
