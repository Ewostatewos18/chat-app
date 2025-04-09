"use client";
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue,  } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface UserInfo {
  uid: string;
  displayName: string;
  isOnline: boolean;
  photoURL: string | null;
}

const UserList = ({ onSelectUser }: { onSelectUser: (user: UserInfo) => void }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [search, setSearch] = useState('');
  const db = getDatabase();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const formatted = Object.entries(data)
        .filter(([uid]) => uid !== currentUser.uid)
        .map(([uid, value]: [string, any]) => ({
          uid,
          displayName: value.displayName?.split('@')[0] || 'Unknown',
          isOnline: value.isOnline,
          photoURL: value.photoURL || null,
        }));

      setUsers(formatted);
      setFilteredUsers(formatted);
    });

    return () => unsubscribe();
  }, [currentUser, db]);

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
                    <span className="text-gray-600">{user.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="text-gray-800 font-medium">
                  {user.displayName}
                </div>
              </div>
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1 mr-1 ${user.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}
              ></div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-gray-400">No users found</p>
        )}
      </div>
    </div>
  );
};

export default UserList;


