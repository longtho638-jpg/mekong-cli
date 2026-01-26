import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { AuthResponse } from '../types/auth';

interface UseSocialLoginReturn {
  initiateLogin: (provider: string) => void;
  handleCallback: (code: string, provider: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useSocialLogin = (): UseSocialLoginReturn => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates the OAuth flow by redirecting to the backend's authorization URL
   * @param provider - The social provider (e.g., 'google', 'github', 'discord')
   */
  const initiateLogin = (provider: string) => {
    setIsLoading(true);
    setError(null);

    // In a real app, this should redirect to your backend endpoint that handles the OAuth redirect
    // Example: http://api.yourdomain.com/api/v1/auth/{provider}/login
    // The backend will then redirect the user to the provider's login page
    const baseURL = apiClient.defaults.baseURL || '';
    window.location.href = `${baseURL}/auth/${provider}/login`;
  };

  /**
   * Handles the OAuth callback processing
   * @param code - The authorization code from the provider
   * @param provider - The social provider
   */
  const handleCallback = async (code: string, provider: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<AuthResponse>(`/auth/${provider}/callback`, {
        code,
      });

      login(response.data);
    } catch (err: any) {
      console.error('Social login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiateLogin,
    handleCallback,
    isLoading,
    error,
  };
};
