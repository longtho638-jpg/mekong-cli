/**
 * WebSocket hook with 25ms buffering to prevent React re-render storms.
 * Auto-reconnects with exponential backoff (max 30s).
 */
import { useEffect, useRef, useCallback } from 'react';
import { useTradingStore, PriceTick } from '../stores/trading-store';

export function useWebSocketPriceFeed() {
  const bufferRef = useRef<PriceTick[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(1000);
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const { updatePrices, setConnected } = useTradingStore();

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const url = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryDelayRef.current = 1000; // reset backoff on success
      };

      ws.onclose = () => {
        setConnected(false);
        if (!mountedRef.current) return;
        // Exponential backoff: 1s → 2s → 4s → … → 30s max
        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, 30_000);
        retryRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close(); // trigger onclose → reconnect

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
              }, 25);
            }
          }
        } catch { /* ignore malformed */ }
      };
    } catch {
      // WebSocket constructor can throw if URL invalid
      setConnected(false);
    }
  }, [updatePrices, setConnected]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);
}
