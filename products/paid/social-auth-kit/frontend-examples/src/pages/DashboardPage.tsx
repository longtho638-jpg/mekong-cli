import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', fontFamily: 'Roboto, sans-serif' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Dashboard</h1>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <main>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>User Profile</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}

            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 500, margin: '0 0 0.5rem 0' }}>{user?.name}</p>
              <p style={{ color: '#666', margin: 0 }}>{user?.email}</p>
              <div style={{
                marginTop: '0.5rem',
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                Provider: {user?.provider}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Raw User Data</h3>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflowX: 'auto'
            }}>
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
};
