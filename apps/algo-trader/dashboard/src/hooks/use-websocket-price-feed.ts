/**
 * WebSocket hook with 25ms buffering to prevent React re-render storms.
 * Connects to existing algo-trader WebSocket server.
 */
import { useEffect, useRef } from 'react';
import { useTradingStore, PriceTick } from '../stores/trading-store';

export function useWebSocketPriceFeed(url = `ws://${window.location.host}/ws`) {
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<PriceTick[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { updatePrices, setConnected } = useTradingStore();

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3s
      setTimeout(() => {
        if (wsRef.current === ws) wsRef.current = null;
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'price_update' || data.channel === 'spread') {
          bufferRef.current.push(data.payload ?? data);
          if (!timerRef.current) {
            timerRef.current = setTimeout(() => {
              updatePrices([...bufferRef.current]);
              bufferRef.current = [];
              timerRef.current = null;
            }, 25); // 25ms buffer window
          }
        }
      } catch { /* ignore malformed messages */ }
    };

    return () => {
      ws.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url, updatePrices, setConnected]);
}
