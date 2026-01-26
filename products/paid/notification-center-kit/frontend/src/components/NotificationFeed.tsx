import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../hooks/useNotifications';
import { subscribeUserToPush } from '../utils/push-manager';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface NotificationFeedProps {
  userId: string;
  vapidPublicKey?: string; // Optional: Required for Push Notifications
}

export const NotificationFeed: React.FC<NotificationFeedProps> = ({ userId, vapidPublicKey }) => {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if push is already enabled
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsPushEnabled(!!subscription);
        });
      });
    }
  }, []);

  const handleEnablePush = async () => {
    if (!vapidPublicKey) {
      console.warn("VAPID Public Key is missing");
      return;
    }
    const subscription = await subscribeUserToPush(vapidPublicKey);
    if (subscription) {
      setIsPushEnabled(true);
      // In a real app, you would send this subscription to the backend here
      // await saveSubscriptionToBackend(userId, subscription);
      console.log("Push Subscription:", JSON.stringify(subscription));
      alert("Push notifications enabled! (Check console for subscription object to send to backend)");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Bell className={cn("w-6 h-6 text-gray-600", !isConnected && "opacity-50")} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
             <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-400 border-2 border-white rounded-full" title="Disconnected"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 origin-top-right bg-white rounded-lg shadow-xl border border-gray-200 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                        <Check className="w-3 h-3 mr-1" />
                        Mark all read
                    </button>
                )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-50 transition-colors relative group",
                      !notification.is_read ? "bg-blue-50/50" : "bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium text-gray-900", !notification.is_read && "font-bold")}>
                                {/* Sanitize title to prevent XSS */}
                                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notification.title) }} />
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {/* Sanitize body to prevent XSS */}
                                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notification.body) }} />
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                        </div>
                        {!notification.is_read && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                }}
                                className="ml-2 p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Mark as read"
                            >
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

           {/* Footer */}
           <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between items-center">
             {vapidPublicKey && !isPushEnabled ? (
                <button
                    onClick={handleEnablePush}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                >
                    <Settings className="w-3 h-3 mr-1" />
                    Enable Push
                </button>
             ) : (
                <span className="text-xs text-gray-400">
                    {isPushEnabled ? "Push Enabled" : "v1.0.0"}
                </span>
             )}

             <button onClick={() => setIsOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">
                 Close
             </button>
           </div>
        </div>
      )}
    </div>
  );
};
