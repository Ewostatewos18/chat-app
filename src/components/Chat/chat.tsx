"use client";
import { useEffect, useRef, useState } from 'react';
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  update,
  remove,
} from 'firebase/database';
import { getAuth, signOut } from 'firebase/auth';
import { app } from "../../firebase/firebase";
import UserList from './UserList';

interface User {
  uid: string;
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);

  const db = getDatabase(app);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateChatId = (receiverId: string) => {
    if (!user) return "";
    return user.uid < receiverId ? `${user.uid}_${receiverId}` : `${receiverId}_${user.uid}`;
  };

  const handleSelectUser = (receiver: User) => {
    const chatId = generateChatId(receiver.uid);
    setCurrentChatId(chatId);
    setSelectedUser(receiver);
    fetchMessages(chatId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = (chatId: string) => {
    setMessages([]);
    const messagesRef = ref(db, `chats/${chatId}`);

    onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      const newMsg: Message = {
        id: snapshot.key!,
        text: msg.text,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        senderName: msg.senderName,
      };
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
    });

    onChildChanged(messagesRef, (snapshot) => {
      const updated = snapshot.val();
      const updatedMsg: Message = {
        id: snapshot.key!,
        text: updated.text,
        createdAt: updated.createdAt,
        senderId: updated.senderId,
        senderName: updated.senderName,
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
      );
    });

    onChildRemoved(messagesRef, (snapshot) => {
      const removedId = snapshot.key!;
      setMessages((prev) => prev.filter((msg) => msg.id !== removedId));
    });
  };

  const handleSendMessage = () => {
    if (newMessageText.trim() && user && currentChatId) {
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
    setContextMenu(null);
  };

  const handleUpdateMessage = (id: string) => {
    if (editText.trim()) {
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
    setContextMenu(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (editingMessageId) {
        handleUpdateMessage(editingMessageId);
      } else {
        handleSendMessage();
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId: id });
  };

  const handleClickOutside = () => {
    setContextMenu(null);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="font-semibold text-lg">{user?.displayName || "Anonymous"}</div>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
        <UserList onSelectUser={handleSelectUser} />
      </div>

      <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col relative">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center space-x-3">
  {selectedUser.photoURL && (
    <img
      src={selectedUser.photoURL}
      alt={selectedUser.displayName}
      className="w-10 h-10 rounded-full object-cover"
    />
  )}
  <h3 className="text-lg font-medium">{selectedUser.displayName}</h3>
</div>


            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length ? (
                messages.map((message) => {
                  const isCurrentUser = message.senderId === user?.uid;
                  const isEditing = editingMessageId === message.id;

                  return (
                    <div
                      key={message.id}
                      className={`max-w-[70%] px-4 py-2 rounded-xl shadow-sm text-sm ${
                        isCurrentUser
                          ? "ml-auto bg-blue-100 text-blue-900"
                          : "mr-auto bg-white text-gray-800 border border-gray-200"
                      }`}
                      onContextMenu={(e) => isCurrentUser && handleRightClick(e, message.id)}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="w-full p-1 rounded border border-gray-300"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleUpdateMessage(message.id)} className="text-xs text-green-600">Save</button>
                            <button onClick={handleCancelEdit} className="text-xs text-gray-500">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>{message.text}</p>
                          <div className="text-[10px] text-gray-400 text-right mt-1">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400">No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {contextMenu && (
              <div
                className="absolute z-50 bg-white border rounded-md shadow-md text-sm"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                  onClick={() =>
                    handleStartEdit(
                      contextMenu.messageId,
                      messages.find((m) => m.id === contextMenu.messageId)?.text || ""
                    )
                  }
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMessage(contextMenu.messageId)}
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={editingMessageId ? editText : newMessageText}
                  onChange={(e) =>
                    editingMessageId
                      ? setEditText(e.target.value)
                      : setNewMessageText(e.target.value)
                  }
                  onKeyDown={handleKeyPress}
                  className="flex-1 p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={editingMessageId ? () => handleUpdateMessage(editingMessageId) : handleSendMessage}
                  disabled={(editingMessageId ? editText : newMessageText).trim() === ""}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {editingMessageId ? "Save" : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
