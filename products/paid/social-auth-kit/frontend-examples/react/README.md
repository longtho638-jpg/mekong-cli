# Social Auth Kit - React Hooks

This folder contains the ready-to-use React hooks for integrating Social Auth Kit.

## Installation

```bash
npm install axios
```

## Usage

1. Copy `hooks/useAuth.ts` and `api/client.ts` to your project.
2. Wrap your app or component with the logic.

```tsx
import { useAuth } from './hooks/useAuth';

const Login = () => {
  const { login } = useAuth();

  return (
    <button onClick={() => login('google')}>
      Login with Google
    </button>
  );
};
```
