# Integration Guide

This guide explains how to integrate the **Social Auth Kit** into your application. The kit consists of two parts:
1. **Backend**: FastAPI service handling OAuth, Tokens, and Users.
2. **Frontend**: React hooks and components for your UI.

## 1. Backend Integration

The backend is designed to run as a microservice or be mounted into an existing FastAPI app.

### Option A: Standalone Microservice (Recommended)

Run the backend using Docker or directly with Python. It exposes REST endpoints at `/api/v1`.

**Configuration:**
Ensure your `.env` file is populated with your OAuth credentials (see `DEPLOYMENT.md`).

**API Endpoints:**
- `GET /api/v1/auth/login/{provider}`: Returns the redirect URL for the provider.
- `GET /api/v1/auth/callback/{provider}`: Handles the OAuth callback, creates user, sets cookies.
- `GET /api/v1/auth/me`: Returns the current authenticated user.
- `POST /api/v1/auth/refresh`: Refreshes the access token using the HttpOnly cookie.
- `POST /api/v1/auth/logout`: Clears the session.

### Option B: Mount in Existing App

If you have an existing FastAPI application, you can mount the routers directly.

```python
from fastapi import FastAPI
from app.api.v1.api import api_router as auth_router
from app.core.config import settings

app = FastAPI()

# Include the auth routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
```

## 2. Frontend Integration (React)

We provide a complete React integration kit in `frontend-examples/`.

### Setup

1. Copy the `src` folder from `frontend-examples` into your project (e.g., as `src/auth-kit`).
2. Install dependencies:
   ```bash
   npm install axios @tanstack/react-query react-router-dom
   ```

### Quick Implementation

Wrap your app in the `AuthProvider`:

```tsx
// App.tsx
import { AuthProvider } from './auth-kit/context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <YourApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Adding Login Buttons

Use the pre-styled `SocialLoginButton`:

```tsx
import { SocialLoginButton } from './auth-kit/components/SocialLoginButton';

const LoginPage = () => (
  <div className="flex flex-col gap-4">
    <SocialLoginButton provider="google" />
    <SocialLoginButton provider="github" />
    <SocialLoginButton provider="discord" />
  </div>
);
```

### Handling the Callback

Create a route at `/auth/callback` (or your configured redirect path) to handle the OAuth response.

```tsx
// CallbackPage.tsx
import { useEffect } from 'react';
import { useSocialLogin } from './auth-kit/hooks/useSocialLogin';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useSocialLogin();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || 'google'; // You should track provider in state/storage ideally

    if (code) {
      handleCallback(code, provider).then(() => navigate('/dashboard'));
    }
  }, [searchParams]);

  return <div>Logging in...</div>;
};
```

### Protected Routes

Protect routes that require authentication:

```tsx
import { ProtectedRoute } from './auth-kit/components/ProtectedRoute';

<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### Accessing User Data

```tsx
import { useAuth } from './auth-kit/context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h1>Hello, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## 3. Customization

### Styles
The components use inline styles for maximum compatibility. You can easily replace them with Tailwind classes or CSS modules in `src/auth-kit/components/SocialLoginButton.tsx`.

### API Client
Configure the base URL in `src/auth-kit/api/client.ts`:

```typescript
export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true, // Crucial for refresh tokens
});
```
