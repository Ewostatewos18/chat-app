"use client";
import { useEffect, useState } from "react";
import {
  getDatabase,
  ref,
  onValue,
  onDisconnect,
  set,
} from "firebase/database";
import { getAuth } from "firebase/auth";
import {
  FiUser,
  FiArrowLeft,
  FiEdit2,
  FiLogOut,
} from "react-icons/fi";

interface UserInfo {
  uid: string;
  displayName: string;
  isOnline: boolean;
  photoURL: string | null;
  email: string;
  lastSeen?: number;
}

const formatLastSeen = (timestamp: number | null): string => {
  if (!timestamp) return "last seen recently";

  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins}m ago`;
  if (hours < 24) return `last seen ${hours}h ago`;
  if (days < 7) return `last seen ${days}d ago`;

  return "last seen recently";
};

const UserList = ({ onSelectUser }: { onSelectUser: (user: UserInfo) => void }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [search, setSearch] = useState("");
  const [showOwnProfile, setShowOwnProfile] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserInfo | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const db = getDatabase();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const userRef = ref(db, `users/${currentUser.uid}`);
    set(userRef, {
      displayName: currentUser.displayName?.split("@")[0] || "You",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || null,
      isOnline: true,
      lastSeen: Date.now(),
    });
    onDisconnect(userRef).set({
      displayName: currentUser.displayName?.split("@")[0] || "You",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || null,
      isOnline: false,
      lastSeen: Date.now(),
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const formatted = Object.entries(data).map(([uid, value]: [string, any]) => ({
        uid,
        displayName: value.displayName?.split("@")[0] || "Unknown",
        isOnline: value.isOnline,
        photoURL: value.photoURL || null,
        email: value.email || "unknown@user.com",
        lastSeen: value.lastSeen || null,
      }));
      const filtered = formatted.filter((u) => u.uid !== currentUser.uid);
      const me = formatted.find((u) => u.uid === currentUser.uid) || null;

      setUsers(filtered);
      setFilteredUsers(filtered);
      setCurrentUserData(me);
      setNewName(me?.displayName || "");
    });
  }, [currentUser]);

  useEffect(() => {
    const results = users.filter((user) =>
      user.displayName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(results);
  }, [search, users]);

  const handleNameEdit = async () => {
    if (!currentUser) return;
    const userRef = ref(db, `users/${currentUser.uid}`);
    await set(userRef, {
      ...currentUserData,
      displayName: newName,
      lastSeen: Date.now(),
      isOnline: true,
    });
    setEditingName(false);
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {!showOwnProfile ? (
          <button
            onClick={() => setShowOwnProfile(true)}
            className="p-2 rounded-full hover:bg-gray-200 transition"
          >
            <FiUser className="w-6 h-6 text-gray-700" />
          </button>
        ) : (
          <button
            onClick={() => setShowOwnProfile(false)}
            className="p-2 rounded-full hover:bg-gray-200 transition"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>

      {!showOwnProfile && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 pl-1">Chats</h2>
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 rounded-full border border-gray-300 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] flex flex-col gap-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => onSelectUser(user)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-white text-sm">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="avatar"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-gray-800 font-medium">{user.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {user.isOnline ? (
                          <span className="text-green-500 font-medium">online</span>
                        ) : (
                          formatLastSeen(user.lastSeen || null)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-400">No users found</p>
            )}
          </div>
        </>
      )}

      {showOwnProfile && currentUserData && (
        <div className="relative p-4 bg-gray-50 rounded-xl shadow-inner flex flex-col gap-4 text-sm">
          <button
            onClick={() => setEditingName(!editingName)}
            className="absolute top-4 right-4 text-gray-600 hover:text-blue-500"
          >
            <FiEdit2 />
          </button>

          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
              {currentUserData.photoURL ? (
                <img
                  src={currentUserData.photoURL}
                  alt="Your Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                  {currentUserData.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {editingName ? (
              <input
                type="text"
                className="text-lg font-semibold text-center text-gray-800 bg-white border rounded-full px-3 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleNameEdit}
                onKeyDown={(e) => e.key === "Enter" && handleNameEdit()}
              />
            ) : (
              <div className="text-lg font-semibold text-gray-800">
                {currentUserData.displayName}
              </div>
            )}

            <div className="text-sm text-gray-500">{currentUserData.email}</div>
            <div className="text-xs">
              {currentUserData.isOnline ? (
                <span className="text-green-500 font-medium">online</span>
              ) : (
                <span className="text-gray-400">
                  {formatLastSeen(currentUserData.lastSeen || null)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => getAuth().signOut()}
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm"
          >
            <FiLogOut />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;
