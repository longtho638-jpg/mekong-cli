# Installation Guide

## System Requirements

- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Python**: 3.11+ (Only if running locally without Docker)
- **Node.js**: 18+ (Only if running locally without Docker)

## Option 1: Docker (Recommended)

This is the fastest way to get started. It spins up the Backend, Frontend, Redis, and Postgres databases automatically.

1.  **Clone/Unzip the project.**
2.  **Navigate to the root directory.**
3.  **Configure Environment Variables**:
    Edit `docker-compose.yml` to include your API keys:
    ```yaml
    environment:
      - OPENAI_API_KEY=sk-your-key-here
      # Optional:
      # - ANTHROPIC_API_KEY=sk-ant-...
    ```
4.  **Start Services**:
    ```bash
    docker-compose up --build
    ```
    This may take a few minutes the first time to build images and download dependencies.

5.  **Verify**:
    - Visit `http://localhost:3000` for the Chat UI.
    - Visit `http://localhost:8000/api/v1/health` to check backend status.

## Option 2: Local Development (Manual)

If you prefer to run services individually for debugging:

### Backend

1.  Navigate to `backend/`.
2.  Create virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Ensure Redis and Postgres are running locally (or update `.env` to point to cloud instances).
5.  Run server:
    ```bash
    uvicorn app.main:app --reload
    ```

### Frontend

1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run development server:
    ```bash
    npm run dev
    ```

## Troubleshooting

- **Database Connection Error**: Ensure the Postgres container is healthy. `docker-compose logs db`.
- **Redis Error**: Ensure Redis is running on port 6379.
- **API Key Error**: Double check your `docker-compose.yml` or `.env` file.
