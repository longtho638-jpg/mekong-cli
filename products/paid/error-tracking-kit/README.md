# Error Tracking Kit

A self-hosted, lightweight error tracking system similar to Sentry. Includes a FastAPI backend, a React dashboard, and a universal JavaScript SDK.

## Features

*   **Project Management**: Create multiple projects (DSNs).
*   **Issue Grouping**: Automatically groups errors by fingerprint (stack trace/message).
*   **JavaScript SDK**:
    *   Automatic global error capturing (`window.onerror`, `unhandledrejection`).
    *   Manual exception capturing (`captureException`).
    *   Breadcrumbs and Context (User, Tags).
*   **Dashboard**:
    *   View projects and issues.
    *   See error frequency and last seen times.
    *   Inspect stack traces and request details.

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

### 2. Frontend Dashboard

Prerequisites: Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to view the dashboard.

### 3. Using the SDK

1.  Build the SDK (or import source if using a bundler):
    ```bash
    cd sdk
    npm install
    npm run build
    ```
2.  Import and initialize in your app:

```javascript
import { init, captureException } from '@antigravity/error-tracking';

init({
  dsn: 'YOUR_PROJECT_API_KEY', // Get this from the Dashboard
  environment: 'production',
  debug: true
});

// Test it
try {
  throw new Error("Test error!");
} catch (e) {
  captureException(e);
}
```

## Architecture

*   **Backend**: FastAPI, SQLite (async), SQLAlchemy.
*   **Frontend**: React, Vite, Tailwind CSS.
*   **SDK**: TypeScript, zero dependencies (uses `fetch`).

## License

Commercial License.
