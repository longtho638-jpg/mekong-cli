# Installation Guide

This guide covers how to deploy the Feedback Widget Kit backend and dashboard.

## Prerequisites

- **Docker** and **Docker Compose** installed on your server or local machine.
- **Node.js** (v18+) if running the dashboard locally without Docker.

## Deployment Options

### Option 1: Docker Compose (Recommended)

The easiest way to get everything running is using Docker Compose.

1.  **Navigate to the project root**:
    ```bash
    cd feedback-widget-kit
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the `backend` directory (or rely on defaults).
    ```bash
    # backend/.env
    DATABASE_URL=sqlite:///./feedback.db
    UPLOAD_DIR=uploads
    CORS_ORIGINS=*
    ```

3.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

    This will start:
    - **Backend API** at `http://localhost:8000`
    - **Dashboard** (if configured in docker-compose, otherwise run locally)

    *Note: The provided `docker-compose.yml` primarily sets up the backend. You may need to add a service for the dashboard or build it as a static site.*

### Option 2: Manual Deployment

#### Backend (FastAPI)

1.  **Navigate to backend**:
    ```bash
    cd backend
    ```

2.  **Create Virtual Environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    # If requirements.txt is missing, install from pyproject.toml or manually:
    # pip install fastapi uvicorn sqlalchemy pydantic python-multipart aiofiles
    ```

4.  **Run Server**:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

#### Dashboard (React)

1.  **Navigate to dashboard**:
    ```bash
    cd dashboard
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

4.  **Serve**:
    Serve the `dist` folder using Nginx, Vercel, Netlify, or any static host.

## Database Setup

By default, the backend uses **SQLite** (`feedback.db`).

For **PostgreSQL**:
1.  Update `DATABASE_URL` in `.env`:
    ```
    DATABASE_URL=postgresql://user:password@localhost:5432/feedback_db
    ```
2.  Install `psycopg2-binary`:
    ```bash
    pip install psycopg2-binary
    ```

The application uses SQLAlchemy and will automatically create tables on startup if they don't exist. For production, consider using Alembic for migrations.

## Production Checklist

- [ ] Set `CORS_ORIGINS` to your specific frontend domains (e.g., `https://your-app.com`).
- [ ] Use a production-grade database like PostgreSQL.
- [ ] Set up a reverse proxy (Nginx/Caddy) with SSL/TLS.
- [ ] Configure `UPLOAD_DIR` to a persistent volume if using Docker.
- [ ] Secure the Admin Dashboard (add authentication if not already implemented or put behind basic auth/VPN).
