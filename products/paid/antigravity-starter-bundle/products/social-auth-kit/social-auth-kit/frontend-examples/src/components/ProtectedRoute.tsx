import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactElement;
}

/**
 * A wrapper component that protects routes requiring authentication.
 * It checks if the user is authenticated and redirects to the login page if not.
 * It also handles the loading state during the initial auth check.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  children
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You can replace this with a proper loading spinner component
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving the current location to redirect back after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
