# Installation Guide

## 1. Quick Start

If you are starting a new project, simply unzip the kit and run:

```bash
npm install
cd packages/types && npm run build
cd ../backend && npm run dev
# In a new terminal
cd ../frontend && npm run dev
```

## 2. Integrating into Existing Project

### Backend Integration (Express/Node.js)

1.  Copy `packages/types` to your project or publish it as a private package.
2.  Copy `packages/backend/src/services/preferenceService.ts` to your services directory.
3.  Setup the database table (see `packages/backend/src/db/index.ts`).
4.  Mount the routes:
    ```typescript
    import { createPreferenceRouter } from './routes/preferences';
    app.use('/api/preferences', createPreferenceRouter(io));
    ```

### Frontend Integration (Next.js/React)

1.  Copy `packages/frontend/src/context/PreferenceContext.tsx` to your context directory.
2.  Wrap your app with `PreferenceProvider`:
    ```tsx
    <PreferenceProvider apiEndpoint="YOUR_BACKEND_URL">
      <App />
    </PreferenceProvider>
    ```
3.  Copy `packages/frontend/src/components/preferences` to your components directory.
4.  Use components like `<PreferencePanel />` or `<ThemeToggle />` anywhere in your app.

## 3. Database Schema

The kit uses a single table `user_preferences` with a JSONB value column for flexibility.

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, key)
);
```

You can modify this to fit your existing `users` table or keep it separate.
