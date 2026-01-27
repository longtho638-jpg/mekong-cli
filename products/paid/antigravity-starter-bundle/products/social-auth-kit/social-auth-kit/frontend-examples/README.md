# React Frontend Integration Kit

This kit provides a complete set of ready-to-use components, hooks, and utilities for integrating the Social Auth Kit into your React application.

## Features

- **Authentication Context**: Full state management for user sessions (loading, authenticated, user data).
- **Auto-Refresh Token**: Axios interceptors automatically handle 401 errors and refresh access tokens seamlessly.
- **Social Login Hooks**: `useSocialLogin` hook to handle OAuth redirects and callbacks.
- **UI Components**: MD3-styled buttons for Google, GitHub, and Discord.
- **Protected Routes**: Wrapper component for securing pages.
- **TypeScript Support**: Fully typed interfaces for API responses and user data.

## Installation

1. Copy the `src` folder into your project (e.g., `src/auth-kit`).
2. Install dependencies:

```bash
npm install axios react-router-dom
# OR
yarn add axios react-router-dom
```

## Configuration

Set your API base URL in `src/api/client.ts` or via environment variables:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Usage

### 1. Setup Provider

Wrap your application with `AuthProvider` in `App.tsx`:

```tsx
import { AuthProvider } from './auth-kit/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourRouter />
    </AuthProvider>
  );
}
```

### 2. Login Page

Use the `SocialLoginButton` component:

```tsx
import { SocialLoginButton } from './auth-kit/components/SocialLoginButton';

export const LoginPage = () => (
  <div>
    <h1>Login</h1>
    <SocialLoginButton provider="google" />
    <SocialLoginButton provider="github" />
    <SocialLoginButton provider="discord" />
  </div>
);
```

### 3. Protected Routes

Protect sensitive pages using `ProtectedRoute`:

```tsx
import { ProtectedRoute } from './auth-kit/components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';

<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### 4. Access User Data

Use the `useAuth` hook anywhere in your app:

```tsx
import { useAuth } from './auth-kit/context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## Directory Structure

```
src/
├── api/
│   └── client.ts          # Axios instance with interceptors
├── components/
│   ├── ProtectedRoute.tsx # Route guard
│   └── SocialLoginButton.tsx # Styled login buttons
├── context/
│   └── AuthContext.tsx    # React Context for auth state
├── hooks/
│   └── useSocialLogin.ts  # Logic for OAuth flow
├── types/
│   └── auth.ts            # TypeScript interfaces
├── pages/                 # Example pages (Login, Dashboard, Callback)
└── App.tsx                # Example routing setup
```
