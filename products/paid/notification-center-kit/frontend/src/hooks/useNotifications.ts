import { useState, useEffect, useRef, useCallback } from 'react';
import { Notification } from '../types';

const API_URL = 'http://localhost:8000/api/v1/notifications';
const WS_URL = 'ws://localhost:8000/api/v1/notifications/ws';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/?user_id=${userId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Connect WebSocket
  useEffect(() => {
    if (!userId) return;

    const connectWs = () => {
      const ws = new WebSocket(`${WS_URL}/${userId}`);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Notification WebSocket Connected');
      };

      ws.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Simple reconnect logic
        setTimeout(connectWs, 3000);
      };

      wsRef.current = ws;
    };

    fetchNotifications();
    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/${id}/read`, {
        method: 'PATCH',
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/read-all?user_id=${userId}`, {
        method: 'POST',
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
