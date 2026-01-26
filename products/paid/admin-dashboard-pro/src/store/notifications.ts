import { create } from 'zustand';
import { Notification, NotificationType } from '@/types/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: '1',
      title: 'Welcome to Dashboard PRO',
      message: 'You have successfully set up the admin dashboard.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      title: 'System Update',
      message: 'Maintenance scheduled for tonight at 2 AM UTC.',
      type: 'info',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true
    }
  ],
  unreadCount: 1,

  addNotification: (data) => {
    set((state) => {
      const newNotification: Notification = {
        ...data,
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        };
      }
      return state;
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.read;
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  }
}));
