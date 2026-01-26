# Feature Flags Kit

A complete, self-hosted feature flag system with a FastAPI backend, React Admin Dashboard, and TypeScript/React SDK.

## Features

- **Global Kill Switches**: Turn features on/off instantly.
- **Targeting Rules**: Target specific users by ID or Email.
- **Percentage Rollouts**: Gradually roll out features to a percentage of users (deterministic hashing).
- **React SDK**: Easy-to-use hooks (`useFeature`) for your frontend.
- **Admin Dashboard**: Manage flags and rules visually.
- **High Performance**: In-memory caching in SDK, fast SQL queries in backend.

## Quick Start

### 1. Backend Setup

Prerequisites: Python 3.9+

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m app.main
```

The API will be available at `http://localhost:8000`.
Docs at `http://localhost:8000/docs`.

### 2. Admin Dashboard

Prerequisites: Node.js 18+

```bash
cd frontend/admin
npm install
npm run dev
```

Open `http://localhost:5173` to manage your flags.

### 3. Using the SDK in Your React App

1.  Copy the `sdk` folder to your project or publish it to your private registry.
2.  Install dependencies: `npm install axios` (plus peer deps `react`, `react-dom`).
3.  Wrap your app in `FeatureProvider`:

```tsx
import { FeatureProvider, useFeature } from './sdk'; // Adjust path
import { FeatureFlagsClient } from './sdk';

const client = new FeatureFlagsClient('http://localhost:8000', 'prod');

function App() {
  // Pass user context for targeting (optional)
  const userContext = { user_id: '123', email: 'user@example.com' };

  return (
    <FeatureProvider client={client} userContext={userContext}>
      <MyComponent />
    </FeatureProvider>
  );
}

function MyComponent() {
  const isNewCheckoutEnabled = useFeature('new-checkout-flow');

  return (
    <div>
      {isNewCheckoutEnabled ? <NewCheckout /> : <OldCheckout />}
    </div>
  );
}
```

## Architecture

*   **Backend**: FastAPI, SQLAlchemy (SQLite by default), Pydantic.
*   **Frontend**: React, Tailwind CSS, Vite.
*   **SDK**: TypeScript, Axios, React Context API.

## License

Commercial License.
