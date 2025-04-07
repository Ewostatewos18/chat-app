"use client";
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface UserInfo {
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

const UserList = ({ onSelectUser }: { onSelectUser: (user: UserInfo) => void }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // State to handle loading
  const db = getDatabase();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return; // Early exit if the user isn't authenticated

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLoading(false);
        return;
      }

      const formatted = Object.entries(data as { [key: string]: UserData })
        .filter(([uid]) => uid !== currentUser?.uid) // Filter out current user
        .map(([uid, value]) => ({
          uid,
          displayName: value.displayName,
          photoURL: value.photoURL || '/default-avatar.png', // Default avatar if photoURL is missing
          isOnline: value.isOnline,
        }));

      // Ensure no duplicate users based on `uid`
      const uniqueUsers = Array.from(new Map(formatted.map(user => [user.uid, user])).values());

      setUsers(uniqueUsers);  // Set unique users
      setLoading(false); // Set loading to false after fetching data
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser, db]);

  return (
    <div className="user-list">
      <h2>Users</h2>
      {loading ? (
        <p>Loading users...</p> // Show loading message
      ) : users.length > 0 ? (
        users.map((user) => (
          <div
            key={user.uid}  // Ensure each user has a unique key
            className="user-item"
            onClick={() => onSelectUser(user)}
          >
            <img
         src={user.photoURL || '/default-avatar.png'} // Ensure src is always a string
         alt={user.displayName || 'User Avatar'}
         className="avatar"
         />

            <div>
              <div>{user.displayName}</div>
              <div className={`status ${user.isOnline ? 'online' : 'offline'}`}>
                {user.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No users available</p>
      )}
    </div>
  );
};

export default UserList;
