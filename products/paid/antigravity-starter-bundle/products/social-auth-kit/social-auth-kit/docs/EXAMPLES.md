# Examples & Use Cases

This guide provides practical examples of how to use **Social Auth Kit** in common scenarios.

## 1. Protecting a React Route

Create a `PrivateRoute` component that checks if the user is authenticated before rendering content.

```tsx
// components/PrivateRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex justify-center p-10">Loading...</div>;
  }

  return user ? <>{children}</> : null;
};
```

**Usage:**
```tsx
export default function Dashboard() {
  return (
    <PrivateRoute>
      <h1>Protected Dashboard</h1>
      <p>Only logged-in users can see this.</p>
    </PrivateRoute>
  );
}
```

---

## 2. Customizing the User Model

You might want to store additional data like `role` or `subscription_plan`.

**Backend (`backend/app/models/user.py`):**
```python
# Add new columns to the SQLAlchemy model
class User(Base):
    # ... existing fields
    role = Column(String, default="user")
    subscription_status = Column(String, default="free")
```

**Schema (`backend/app/schemas/user.py`):**
```python
# Update Pydantic schemas
class UserBase(BaseModel):
    # ... existing fields
    role: Optional[str] = "user"
    subscription_status: Optional[str] = "free"
```

**Migration:**
```bash
cd backend
poetry run alembic revision --autogenerate -m "Add role and subscription"
poetry run alembic upgrade head
```

---

## 3. Handling API Requests with Axios

Use the configured axios client (`api/client.ts`) to make authenticated requests to your backend services. It automatically handles token attachment and refreshing.

```ts
import client from '@/api/client';

// Fetch user's orders
const fetchOrders = async () => {
  try {
    const response = await client.get('/api/v1/orders');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch orders", error);
    throw error;
  }
};

// Create a new resource
const createProject = async (name: string) => {
  const response = await client.post('/api/v1/projects', { name });
  return response.data;
};
```

---

## 4. Next.js Server-Side Rendering (SSR)

If using Next.js App Router or SSR, you might want to check authentication on the server. Since `httponly` cookies are sent to the server, you can validate the refresh token or forward the request.

*Note: The current kit emphasizes client-side auth for simplicity (SPA pattern), but hybrid is possible.*

**Middleware Approach (`middleware.ts`):**
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the refresh_token cookie
  const refreshToken = request.cookies.get('refresh_token');

  if (!refreshToken && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

---

## 5. Troubleshooting

### "Invalid OAuth Redirect URI"
**Symptoms**: Google/GitHub shows a 400 error page saying the redirect URI is mismatched.
**Fix**: Ensure the `redirect_uri` constructed in `backend/app/api/v1/endpoints/auth.py` matches EXACTLY what you entered in the provider's dashboard.
- Local: `http://localhost:8000/api/v1/auth/callback/google`
- **Watch out for**: `http` vs `https`, trailing slashes.

### "401 Unauthorized" Loop
**Symptoms**: Frontend keeps trying to refresh token but fails.
**Fix**:
1. Check if `refresh_token` cookie is being set in the browser DevTools > Application > Cookies.
2. If using `localhost` frontend and backend, ensure `secure=False` is set for the cookie in `auth.py` OR run backend with HTTPS proxy.
3. Check `BACKEND_CORS_ORIGINS` in `.env` includes your frontend URL exactly (e.g., `http://localhost:3000`).

### "CORS Error"
**Symptoms**: Browser console shows "Access-Control-Allow-Origin" error.
**Fix**:
Update `.env` to include your frontend port:
```ini
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```
