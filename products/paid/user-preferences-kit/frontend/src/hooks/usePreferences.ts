import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, UserPreferencesUpdate } from '../types';

const API_URL = 'http://localhost:8000/api'; // Configure as needed

export const usePreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/preferences/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      const data = await response.json();
      setPreferences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updatePreferences = async (updates: UserPreferencesUpdate) => {
    try {
      // Optimistic update
      setPreferences((prev) => (prev ? { ...prev, ...updates } : null));

      const response = await fetch(`${API_URL}/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Revert optimistic update on failure (requires keeping previous state, simplified here)
      fetchPreferences();
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId, fetchPreferences]);

  return { preferences, loading, error, updatePreferences, refreshPreferences: fetchPreferences };
};
