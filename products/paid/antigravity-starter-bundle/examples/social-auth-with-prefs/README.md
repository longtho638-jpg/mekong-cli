# Social Auth + User Preferences Integration 🤝

This example demonstrates the pattern of fetching user preferences immediately after a user logs in.

## The Pattern

1.  **User Login:** The user authenticates via the **Social Auth Kit**.
2.  **Token Generation:** The Auth Kit returns a JWT (JSON Web Token).
3.  **Client Handling:** The frontend stores this JWT.
4.  **Fetching Preferences:** The frontend uses the JWT to call the **User Preferences Kit**.
5.  **Authorization:** The Preferences Kit validates the JWT and returns settings for that specific user.

## Code Snippet (Frontend - React/Next.js)

```typescript
import { useEffect, useState } from 'react';

const UserProfile = () => {
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      // 1. Get the token stored after login
      const token = localStorage.getItem('auth_token');

      if (!token) return;

      // 2. Call the Preferences Service
      const response = await fetch('http://localhost:3002/api/preferences', {
        headers: {
          'Authorization': `Bearer ${token}` // Pass token for validation
        }
      });

      const data = await response.json();
      setPreferences(data);
    };

    fetchPrefs();
  }, []);

  if (!preferences) return <div>Loading settings...</div>;

  return (
    <div className={preferences.theme === 'dark' ? 'bg-black text-white' : 'bg-white'}>
      <h1>Welcome back!</h1>
      <p>Notifications: {preferences.notificationsEnabled ? 'On' : 'Off'}</p>
    </div>
  );
};
```

## Backend Middleware (Concept)

In the User Preferences Kit, we verify the token:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Contains user_id
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};
```
