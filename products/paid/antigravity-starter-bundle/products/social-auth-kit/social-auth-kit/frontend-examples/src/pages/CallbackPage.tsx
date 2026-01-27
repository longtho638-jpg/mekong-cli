import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSocialLogin } from '../hooks/useSocialLogin';

export const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback, error } = useSocialLogin();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Optional: validate state for security

    // In a real app, you might want to determine the provider dynamically or from state
    // For this example, we'll assume a 'provider' query param or default to one
    // Ideally, your backend redirect should include the provider or you track it in sessionStorage
    const provider = searchParams.get('provider') || 'google';

    if (code) {
      handleCallback(code, provider)
        .then(() => {
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Login callback failed', err);
          // Error is handled by the hook state usually, but we can redirect or show error here
        });
    }
  }, [searchParams, handleCallback, navigate]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <h3>Login Failed</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Processing login...</p>
    </div>
  );
};
