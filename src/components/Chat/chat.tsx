"use client";
import { useEffect, useRef, useState } from "react";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  update,
  remove,
} from "firebase/database";
import { getAuth,  } from "firebase/auth";
import { app } from "../../firebase/firebase";
import UserList from "./UserList";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);


interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL: string | null;
  isOnline: boolean;
  lastSeen?: number;
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const db = getDatabase(app);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d");
  };

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    if ((editingMessageId ? editText : newMessageText).trim() && user && currentChatId) {
      const postData = {
        text: editingMessageId ? editText : newMessageText,
        createdAt: new Date().toISOString(),
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
      };

      if (editingMessageId) {
        update(ref(db, `/chats/${currentChatId}/${editingMessageId}`), postData);
        setEditingMessageId(null);
        setEditText("");
      } else {
        push(ref(db, `chats/${currentChatId}`), postData);
        setNewMessageText("");
      }
    }
  };

  const handleUpdateMessage = (id: string) => {
    if (editText.trim() && currentChatId) {
      update(ref(db, `/chats/${currentChatId}/${id}`), {
        text: editText,
        createdAt: new Date().toISOString(),
      });
      setEditingMessageId(null);
      setEditText("");
    }
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

  const handleStartEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditText(text);
    setContextMenu(null);
  };

  const handleDeleteMessage = (id: string) => {
    remove(ref(db, `/chats/${currentChatId}/${id}`));
    setContextMenu(null);
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId: id });
  };

  const handleEmojiSelect = (emoji: any) => {
    const emojiChar = emoji.native;
    if (editingMessageId) {
      setEditText((prev) => prev + emojiChar);
    } else {
      setNewMessageText((prev) => prev + emojiChar);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 p-4 bg-white">
        <UserList onSelectUser={handleSelectUser} />
      </div>

      {/* Chat Section */}
      <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col relative">
        {selectedUser ? (
          <>
            {/* Header */}
       {/* Header */}
<div
  className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center gap-4 cursor-pointer"
  onClick={() => setShowProfileModal(true)}
>
  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shadow">
    {selectedUser.photoURL ? (
      <img
        src={selectedUser.photoURL}
        alt="User Avatar"
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
        {selectedUser.displayName?.charAt(0).toUpperCase()}
      </div>
    )}
  </div>

  <div className="flex flex-col justify-center">
    <div className="text-base font-semibold text-gray-800">
      {selectedUser.displayName}
    </div>
    <div className={`text-xs ${selectedUser.isOnline ? "text-green-500" : "text-gray-400"}`}>
      {selectedUser.isOnline
        ? "Online"
        : selectedUser.lastSeen
        ? `Last seen ${dayjs(selectedUser.lastSeen).calendar(null, {
            sameDay: '[at] h:mm A',
            lastDay: '[yesterday at] h:mm A',
            lastWeek: '[on] MMM D [at] h:mm A',
            sameElse: '[on] MMM D [at] h:mm A',
          })}`
        : "Last seen long time ago"}
    </div>
  </div>
</div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
              {messages.length ? (
                Object.entries(
                  messages.reduce((groups: { [date: string]: Message[] }, msg) => {
                    const dateKey = formatDate(msg.createdAt);
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(msg);
                    return groups;
                  }, {})
                ).map(([date, groupMsgs]) => (
                  <div key={date} className="space-y-2">
                    <div className="text-center text-xs text-gray-500">{date}</div>
                    {groupMsgs.map((message) => {
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
                            <>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-1 rounded border border-gray-300"
                              />
                              <div className="flex justify-between mt-1">
                                <button onClick={() => handleUpdateMessage(message.id)} className="text-xs text-green-600">Save</button>
                                <button onClick={() => setEditingMessageId(null)} className="text-xs text-gray-500">Cancel</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p>{message.text}</p>
                              <div className="text-[10px] text-gray-400 text-right mt-1">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400">No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
              <div className="absolute z-50 bg-white border rounded-md shadow-md text-sm" style={{ top: contextMenu.y, left: contextMenu.x }}>
                <button onClick={() => handleStartEdit(contextMenu.messageId, messages.find((m) => m.id === contextMenu.messageId)?.text || "")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100">Edit</button>
                <button onClick={() => handleDeleteMessage(contextMenu.messageId)}
                        className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100">Delete</button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2 relative items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={editingMessageId ? editText : newMessageText}
                  onChange={(e) =>
                    editingMessageId ? setEditText(e.target.value) : setNewMessageText(e.target.value)
                  }
                  onKeyDown={handleKeyPress}
                  className="flex-1 p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <div className="relative" onMouseEnter={() => setShowEmojiPicker(true)} onMouseLeave={() => setShowEmojiPicker(false)}>
                  <button type="button" className="p-2 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                         stroke="currentColor" className="w-6 h-6 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 15.75c-1.988 0-3.75-1.299-3.75-3h7.5c0 1.701-1.762 3-3.75 3zM9.75 9.75h.008v.008H9.75V9.75zm4.5 0h.008v.008h-.008V9.75zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 z-50">
                      <Picker onEmojiSelect={handleEmojiSelect} theme="light" data={data} />
                    </div>
                  )}
                </div>

                <button
                  onClick={editingMessageId ? () => handleUpdateMessage(editingMessageId) : handleSendMessage}
                  disabled={(editingMessageId ? editText : newMessageText).trim() === ""}
                  className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth="1.5"
                       className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3.75 21L20.25 12 3.75 3v7.5l12 1.5-12 1.5V21z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && selectedUser && (
              <div className="absolute right-0 top-0 h-full w-full md:w-[350px] z-50 bg-white shadow-lg border-l border-gray-200 flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setShowProfileModal(false)}>
                    ←
                  </button>
                  <div className="w-6"></div>
                </div>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 shadow">
  {selectedUser.photoURL ? (
    <img
      src={selectedUser.photoURL}
      alt="User Avatar"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
      {selectedUser.displayName?.charAt(0).toUpperCase()}
    </div>
  )}
</div>

                  <h2 className="text-xl font-semibold text-gray-900">{selectedUser.displayName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email || "No email available"}</p>
                  <span className={`text-sm font-medium ${selectedUser.isOnline ? "text-green-500" : "text-gray-400"}`}>
  {selectedUser.isOnline
    ? "Online"
    : selectedUser.lastSeen
    ? `Last seen ${dayjs(selectedUser.lastSeen).calendar(null, {
        sameDay: '[at] h:mm A',
        lastDay: '[yesterday at] h:mm A',
        lastWeek: '[on] MMM D [at] h:mm A',
        sameElse: '[on] MMM D [at] h:mm A',
      })}`
    : "Last seen long time ago"}
</span>

                </div>
                <div className="px-6 mt-4 flex flex-col gap-2">
                  <button className="w-full border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 py-2 rounded-md">Block User</button>
                  <button className="w-full border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 py-2 rounded-md">Clear Chat</button>
                </div>
                <div className="mt-6 px-6">
                  <div className="flex justify-around border-b border-gray-200">
                    <button className="flex-1 text-sm py-2 font-medium text-blue-600 border-b-2 border-blue-600">Media</button>
                    <button className="flex-1 text-sm py-2 text-gray-500 hover:text-blue-600">Files</button>
                    <button className="flex-1 text-sm py-2 text-gray-500 hover:text-blue-600">Links</button>
                  </div>
                  <div className="text-sm text-center text-gray-400 mt-4">No items to show</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Select a user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;
