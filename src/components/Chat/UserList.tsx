"use client";
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FiUser } from 'react-icons/fi';

interface UserInfo {
  uid: string;
  displayName: string;
  isOnline: boolean;
  photoURL: string | null;
  email: string;
}

const UserList = ({ onSelectUser }: { onSelectUser: (user: UserInfo) => void }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [search, setSearch] = useState('');
  const [showOwnProfile, setShowOwnProfile] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserInfo | null>(null);

  const db = getDatabase();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const formatted = Object.entries(data).map(([uid, value]: [string, any]) => ({
        uid,
        displayName: value.displayName?.split('@')[0] || 'Unknown',
        isOnline: value.isOnline,
        photoURL: value.photoURL || null,
        email: value.email || "unknown@example.com",
      }));

      const filtered = formatted.filter((u) => u.uid !== currentUser.uid);
      const me = formatted.find((u) => u.uid === currentUser.uid) || null;

      setUsers(filtered);
      setFilteredUsers(filtered);
      setCurrentUserData(me);
    });
  }, [currentUser]);

  useEffect(() => {
    const results = users.filter((user) =>
      user.displayName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(results);
  }, [search, users]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-4">
      {/* Top Bar with Profile Icon */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowOwnProfile(!showOwnProfile)}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <FiUser className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {!showOwnProfile && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 pl-1">Chats</h2>
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 rounded-full border border-gray-300 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={handleSearchChange}
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
                    <div className="text-gray-800 font-medium">{user.displayName}</div>
                  </div>
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1 mr-1 ${
                      user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-400">No users found</p>
            )}
          </div>
        </>
      )}

      {/* Own Profile View */}
      {showOwnProfile && currentUserData && (
        <div className="p-4 bg-gray-50 rounded-xl shadow-inner flex flex-col gap-4 text-sm">
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
            <div className="text-lg font-semibold text-gray-800">
              {currentUserData.displayName}
            </div>
            <div className="text-gray-500">{currentUserData.email}</div>
          </div>

          <button
            className="mt-4 w-full py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            onClick={() => auth.signOut()}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;
