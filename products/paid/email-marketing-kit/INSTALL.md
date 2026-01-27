# Installation Guide

## System Requirements

- Docker & Docker Compose OR
- Python 3.11+
- Node.js 18+ (for Frontend)
- PostgreSQL 15+
- Redis 7+

## Option 1: Docker (Recommended)

1.  **Clone/Unzip**:
    ```bash
    unzip email-marketing-kit-v1.0.0.zip
    cd email-marketing-kit
    ```

2.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Edit .env with your credentials
    ```

3.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

4.  **Run Migrations**:
    ```bash
    docker-compose exec web alembic upgrade head
    ```

5.  **Access**:
    - Frontend: http://localhost:5173 (if running dev server) or configured domain
    - Backend API: http://localhost:8000/docs

## Option 2: Manual Installation

1.  **Backend**:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    alembic upgrade head
    uvicorn app.main:app --reload
    ```

2.  **Worker**:
    ```bash
    # In a new terminal, same venv
    arq app.worker.WorkerSettings
    ```

3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Post-Installation

1.  **Configure Email Provider**: See `RESEND_SETUP.md` or `SENDGRID_SETUP.md`.
2.  **Setup Cron**: Ensure the drip campaign processor is running (integrated in worker or separate cron).
