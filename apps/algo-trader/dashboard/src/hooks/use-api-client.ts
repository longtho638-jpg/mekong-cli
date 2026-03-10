/**
 * Simple API client hook for fetching data from Fastify backend.
 * Supports JWT authentication for license activation and other authenticated endpoints.
 */
import { useState, useCallback } from 'react';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1';

export function useApiClient() {
  const [loading, setLoading] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const fetchApi = useCallback(async <T>(path: string, options?: RequestInit): Promise<T | null> => {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}),
        ...options?.headers,
      };

      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers,
      });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  const setToken = useCallback((token: string) => {
    setJwtToken(token);
    // Optionally persist to sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('jwtToken', token);
    }
  }, []);

  // Load token from sessionStorage on mount
  useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('jwtToken');
      if (stored) {
        setJwtToken(stored);
      }
    }
  });

  return { fetchApi, loading, setToken };
}
