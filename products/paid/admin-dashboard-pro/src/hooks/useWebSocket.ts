import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/websocket';
import { RealTimeData } from '@/types/analytics';

export function useWebSocket() {
  const [data, setData] = useState<RealTimeData>({
    activeUsers: 0,
    serverLoad: 0,
    recentSales: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(true);

    const handleMetrics = (newData: any) => {
      setData(prev => ({
        ...prev,
        ...newData
      }));
    };

    socket.on('metrics', handleMetrics);

    return () => {
      socket.off('metrics', handleMetrics);
    };
  }, []);

  return { data, isConnected };
}
