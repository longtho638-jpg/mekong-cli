import { useState, useCallback, useEffect } from 'react';
import { UserPresence, UserStatus } from '../types'; // Assuming types defined locally or we define inline
import { ConnectionStatus } from './useWebSocket';

export interface PresenceUser {
  user_id: string;
  username: string;
  color: string;
  status: 'online' | 'idle' | 'offline';
  is_typing: boolean;
  cursor_position?: number;
}

export const usePresence = (status: ConnectionStatus) => {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null);

  const handlePresenceUpdate = useCallback((data: any) => {
    if (Array.isArray(data)) {
      // Full list update (init)
      setUsers(data);
    } else {
      // Single user update
      const updatedUser = data as PresenceUser;
      setUsers(prev => {
        const index = prev.findIndex(u => u.user_id === updatedUser.user_id);
        if (updatedUser.status === 'offline') {
           if (index !== -1) {
             const newUsers = [...prev];
             newUsers.splice(index, 1);
             return newUsers;
           }
           return prev;
        }

        if (index !== -1) {
          const newUsers = [...prev];
          newUsers[index] = { ...newUsers[index], ...updatedUser };
          return newUsers;
        } else {
          return [...prev, updatedUser];
        }
      });
    }
  }, []);

  const handleTypingUpdate = useCallback((userId: string, isTyping: boolean) => {
     setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, is_typing: isTyping } : u
     ));
  }, []);

  return { users, handlePresenceUpdate, handleTypingUpdate };
};
