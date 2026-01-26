# Background Jobs Kit

A lightweight, robust background job processing system built with FastAPI (Backend) and React (Frontend), using Redis as the message broker. Designed for simplicity (KISS), YAGNI, and DRY principles.

## Features

- **Queue Management**: Reliable job enqueueing and processing using Redis.
- **Dashboard**: Real-time monitoring of job statuses (Pending, Processing, Completed, Failed).
- **Retry Logic**: Automatic retries for failed jobs with configurable max retries.
- **Dead Letter Queue**: Persistent storage for permanently failed jobs.
- **Worker System**: Scalable worker process template.
- **REST API**: Full programmatic control over jobs and queues.

## Prerequisites

- Python 3.9+
- Node.js 18+
- Redis Server (running locally or accessible via URL)

## Quick Start

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create a virtual environment and install dependencies:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Configure environment (optional, defaults to localhost Redis):

```bash
# Create .env file if needed
echo "REDIS_URL=redis://localhost:6379/0" > .env
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

Start a Worker (in a separate terminal):

```bash
source venv/bin/activate
python -m app.worker
```

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the dashboard:

```bash
npm run dev
```

Open your browser at `http://localhost:5173` to view the dashboard.

## Project Structure

```
background-jobs-kit/
├── backend/
│   ├── app/
│   │   ├── api/          # API Endpoints
│   │   ├── core/         # Configuration
│   │   ├── services/     # Queue Logic (Redis)
│   │   ├── main.py       # FastAPI Entrypoint
│   │   └── worker.py     # Worker Process
│   ├── tests/            # Pytest Suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React Components
│   │   ├── services/     # API Client
│   │   └── App.tsx
│   └── package.json
├── API.md                # API Documentation
├── WORKERS.md            # Worker Deployment Guide
└── EXAMPLES.md           # Usage Examples
```

## Testing

**Backend:**
```bash
cd backend
pytest
```

**Frontend:**
```bash
cd frontend
npm test
```

## License

MIT
