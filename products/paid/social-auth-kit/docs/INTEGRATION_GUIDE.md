# Integration Guide

This guide explains how to integrate the **Social Auth Kit** into your existing application.

## 1. Backend Integration

If you are building a new app, you can use the provided `backend` folder as your starting point.

If you have an existing FastAPI app:

1. **Copy Files**: Copy the `app/providers` directory to your project. This contains the core OAuth logic.
2. **Install Dependencies**: Ensure you have `httpx` and `pydantic` installed.
3. **Database Models**: Integrate the `User` and `RefreshToken` models into your existing SQLAlchemy setup.
4. **Endpoints**: Mount the `auth` router from `app/api/v1/endpoints/auth.py`.

```python
from app.api.v1.endpoints import auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
```

## 2. Frontend Integration (React/Next.js)

We provide a **Headless Hook** (`useAuth`) that handles the complex logic of state management and token refreshing.

### Step 1: Install Dependencies
```bash
npm install axios
```

### Step 2: Setup API Client
Copy `frontend-examples/react/api/client.ts` to your project. This file configures Axios to:
- Send credentials (cookies) with requests.
- Automatically intercept 401 errors and try to refresh the token using the HttpOnly cookie.

### Step 3: Use the Hook
Copy `frontend-examples/react/hooks/useAuth.ts` to your project.

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome, {user.full_name}</div>;

  return (
    <div className="flex gap-4">
      <button onClick={() => login('google')}>Login Google</button>
      <button onClick={() => login('github')}>Login GitHub</button>
    </div>
  );
}
```

### Step 4: Add Login Buttons
We provided styled buttons in `frontend-examples/react/components/SocialButton.tsx`. You can customize them with Tailwind CSS.

## 3. How Refresh Tokens Work

1. **Login**: The backend sets an `httponly` cookie named `refresh_token` and returns a short-lived `access_token` (JSON).
2. **Access**: The frontend uses the `access_token` in the `Authorization: Bearer` header.
3. **Expiry**: When the `access_token` expires (15 min), the backend returns 401.
4. **Auto-Refresh**: The `client.ts` interceptor catches the 401, calls `/auth/refresh` (sending the cookie), gets a new `access_token`, and retries the original request transparently.
5. **Rotation**: The refresh token is rotated (changed) on every use to prevent replay attacks.
