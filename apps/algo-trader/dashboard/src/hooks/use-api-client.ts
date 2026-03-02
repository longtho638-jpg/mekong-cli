/**
 * Simple API client hook for fetching data from Fastify backend.
 */
import { useState, useCallback } from 'react';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1';

export function useApiClient() {
  const [loading, setLoading] = useState(false);

  const fetchApi = useCallback(async <T>(path: string, options?: RequestInit): Promise<T | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchApi, loading };
}
