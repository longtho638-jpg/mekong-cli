import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { User } from '../types/auth';

/**
 * Hook to fetch the current user's profile using React Query.
 * This can be used to re-fetch user data in background or keep it in sync.
 */
export const useUserProfile = (): UseQueryResult<User, Error> => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    },
    // Only run this query if we have an access token (basic check)
    enabled: !!localStorage.getItem('access_token'),
  });
};
