import { create } from 'zustand';
import { User, UserRole, UserStatus } from '@/types/users';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;

  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastActive'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  deleteUsers: (ids: string[]) => void;
}

// Mock initial data
const INITIAL_USERS: User[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `usr_${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  status: i % 10 === 0 ? 'suspended' : 'active',
  lastActive: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`
}));

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      set({ users: INITIAL_USERS, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch users', isLoading: false });
    }
  },

  addUser: (userData) => {
    set((state) => {
      const newUser: User = {
        ...userData,
        id: `usr_${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`
      };
      return { users: [newUser, ...state.users] };
    });
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === id ? { ...user, ...updates } : user
      )
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== id)
    }));
  },

  deleteUsers: (ids) => {
    set((state) => ({
      users: state.users.filter(user => !ids.includes(user.id))
    }));
  }
}));
