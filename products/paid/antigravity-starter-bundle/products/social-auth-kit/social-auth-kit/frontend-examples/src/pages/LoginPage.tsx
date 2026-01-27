import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SocialLoginButton } from '../components/SocialLoginButton';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Roboto, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
          Welcome Back
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SocialLoginButton provider="google" />
          <SocialLoginButton provider="github" />
          <SocialLoginButton provider="discord" />
        </div>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
