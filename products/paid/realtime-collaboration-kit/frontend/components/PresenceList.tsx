import React from 'react';
import { PresenceUser } from '../hooks/usePresence';

interface PresenceListProps {
  users: PresenceUser[];
  currentUserId: string;
}

export const PresenceList: React.FC<PresenceListProps> = ({ users, currentUserId }) => {
  return (
    <div className="flex -space-x-2 overflow-hidden py-2">
      {users.map((user) => (
        <div
          key={user.user_id}
          className="relative inline-block"
          title={`${user.username} (${user.status})`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
            style={{ backgroundColor: user.color }}
          >
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <span
            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
              user.status === 'online' ? 'bg-green-400' : 'bg-gray-300'
            }`}
          />
          {user.is_typing && (
             <div className="absolute -top-2 -right-1 bg-gray-800 text-white text-[9px] px-1 rounded animate-pulse">
               ...
             </div>
          )}
        </div>
      ))}
    </div>
  );
};
