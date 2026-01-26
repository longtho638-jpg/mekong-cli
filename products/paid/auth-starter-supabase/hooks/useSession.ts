import { useAuth } from '../components/auth/auth-provider';

export const useSession = () => {
  const { session, isLoading } = useAuth();
  return { session, isLoading };
};
