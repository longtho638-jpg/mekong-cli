# User Preferences Kit

A complete, production-ready solution for managing user preferences in your web application.

## Features

- **Full-Stack Solution**: Ready-to-use Backend API (FastAPI) and Frontend Components (React).
- **Theme Management**: Dark/Light/System mode toggle.
- **Localization**: Language selector support.
- **Notifications**: Granular control over Email and Push notifications.
- **Privacy Control**: Profile visibility settings.
- **Type-Safe**: Built with TypeScript and Pydantic.
- **Database Integrated**: SQLAlchemy models for PostgreSQL/SQLite.

## Directory Structure

```
user-preferences-kit/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── main.py        # Entry point
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── routes.py      # API endpoints
│   │   └── database.py    # DB configuration
│   └── tests/             # Pytest tests
├── frontend/               # React Components
│   └── src/
│       ├── components/    # UI Components
│       ├── hooks/         # Custom React Hooks
│       └── types/         # TypeScript definitions
└── docs/                   # Additional documentation
```

## Quick Start

### Backend Setup

1. Navigate to `backend/`
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic
   ```
3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Integration

1. Copy the `frontend/src` contents into your React project.
2. Ensure you have `tailwindcss` configured.
3. Use the `PreferencesPanel` component:

```tsx
import { PreferencesPanel } from './components/PreferencesPanel';

function App() {
  const currentUserId = "user_123"; // Replace with actual user ID

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <PreferencesPanel userId={currentUserId} />
    </div>
  );
}
```

## API Endpoints

- `GET /api/preferences/{user_id}`: Get preferences for a user.
- `PUT /api/preferences/{user_id}`: Update specific preferences.

## Customization

### Adding a new setting

1. Update `backend/app/models.py` and `schemas.py` to include the new field.
2. Update `frontend/src/types/index.ts` to match the API.
3. Create a new component in `frontend/src/components/`.
4. Add the component to `PreferencesPanel.tsx`.

## License

MIT License - Free to use in commercial projects.
