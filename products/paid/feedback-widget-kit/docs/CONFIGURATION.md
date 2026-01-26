# Configuration Guide

Configuration is managed via Environment Variables.

## Backend Configuration

Create a `.env` file in the `backend/` directory.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./feedback.db` | Database connection string. Supports SQLite and PostgreSQL. |
| `UPLOAD_DIR` | `uploads` | Local directory to store uploaded screenshots. |
| `CORS_ORIGINS` | `*` | Comma-separated list of allowed origins (e.g., `http://localhost:3000,https://myapp.com`). |
| `PORT` | `8000` | Port to run the server on (if not using Docker). |
| `HOST` | `0.0.0.0` | Host interface to bind to. |

### Database Examples

**SQLite:**
```
DATABASE_URL=sqlite:///./feedback.db
```

**PostgreSQL:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Widget Configuration

The React Widget is configured via props passed to the component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | **Required** | Full URL to the backend feedback endpoint (e.g., `http://localhost:8000/api/v1/feedback`). |
| `primaryColor` | `string` | `#2563eb` | Hex code for the primary button color. |
| `position` | `string` | `bottom-right` | Position on screen: `bottom-right` or `bottom-left`. |
| `onSubmit` | `function` | `undefined` | Optional custom handler if you want to bypass the default API logic. |

## Dashboard Configuration

The dashboard connects to the backend API. Configuration is typically handled via build-time environment variables (Vite).

Create `.env` in `dashboard/`:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of the backend API (e.g., `http://localhost:8000/api/v1`). |

**Example `.env` for Dashboard:**
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
