'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
    }

    const onlineHandler = () => setIsOffline(false);
    const offlineHandler = () => setIsOffline(true);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-[100]">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You are offline. Changes will sync when back online.</span>
    </div>
  );
}
