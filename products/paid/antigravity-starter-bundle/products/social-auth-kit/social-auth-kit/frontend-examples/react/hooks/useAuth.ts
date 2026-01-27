import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

export interface User {
  email: string;
  full_name: string;
  avatar_url: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user (validates access token)
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<User>('/users/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      setUser(null);
      // Don't set error here as it might just be not logged in
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial check
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Initiate Login
  const login = async (provider: 'google' | 'github' | 'discord') => {
    try {
      const response = await apiClient.get<{ authorization_url: string }>(
        `/auth/login/${provider}`
      );
      // Redirect to provider
      window.location.href = response.data.authorization_url;
    } catch (err) {
      setError('Failed to initiate login');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
      // Clear local headers if any
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    fetchUser, // Can call manually to re-validate
  };
};
