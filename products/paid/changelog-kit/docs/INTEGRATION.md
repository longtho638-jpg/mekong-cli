# Integration Guide

How to add the **Changelog Kit** to your React application.

## 1. Backend Integration

The backend is a standalone service that parses your Markdown files and serves the API.

### Option A: Docker (Recommended)
Run the backend as a separate container or service in your cluster. Mount your `data/` folder containing markdown files to `/app/data`.

### Option B: Python Package
Copy the `backend/app` directory into your existing FastAPI project.

```python
from app.api import endpoints as changelog_endpoints

app.include_router(changelog_endpoints.router, prefix="/api/v1")
```

Ensure you install the dependencies: `python-frontmatter`, `markdown`.

## 2. Frontend Integration

You can copy the source code for the components directly into your project.

### Step 1: Copy Files
Copy `frontend/src/components/` and `frontend/src/lib/` to your project structure (e.g., `src/features/changelog`).

### Step 2: Install Dependencies
Ensure you have the required packages:

```bash
npm install axios date-fns framer-motion lucide-react dompurify
npm install -D @types/dompurify
```

### Step 3: Configure API URL
Set the backend URL in your environment variables or modify `lib/api.ts`:

```typescript
const BASE_URL = process.env.REACT_APP_CHANGELOG_API || 'https://api.yourdomain.com/api/v1';
```

### Step 4: Use Components

**Full Page View:**
```tsx
import { ChangelogPage } from './features/changelog/components/ChangelogPage';

function App() {
  return (
    <Route path="/changelog" element={<ChangelogPage />} />
  );
}
```

**Widget (Bell Icon):**
```tsx
import { ChangelogWidget } from './features/changelog/components/ChangelogWidget';

function Layout() {
  return (
    <div>
      <YourAppContent />
      <ChangelogWidget />
    </div>
  );
}
```

## 3. RSS Feed

The backend automatically generates an RSS feed at `/api/v1/feed.xml`. You can link to this in your site head:

```html
<link rel="alternate" type="application/rss+xml" title="Changelog" href="https://api.yourdomain.com/api/v1/feed.xml" />
```
