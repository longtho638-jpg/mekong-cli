'use client';

import { useAuth } from '../auth/auth-provider';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Optional: Return a small spinner or skeleton if you want inline loading
    return null;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
