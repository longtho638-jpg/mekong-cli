import { useAuth } from '../components/auth/auth-provider';

export const useUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
};
