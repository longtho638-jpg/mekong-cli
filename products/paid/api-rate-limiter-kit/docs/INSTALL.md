# Installation Guide

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose)
- **Redis** (if running outside Docker)
- **Python 3.10+** (if running backend locally)
- **Node.js 18+** (if running dashboard locally)

## Option 1: Docker (Recommended)

The easiest way to get started is using Docker Compose.

1. **Unzip the kit**:
   ```bash
   unzip api-rate-limiter-kit-v1.0.0.zip
   cd api-rate-limiter-kit
   ```

2. **Start the services**:
   ```bash
   docker-compose up -d --build
   ```

   This will start:
   - **Backend API** at `http://localhost:8000`
   - **Dashboard** at `http://localhost:3000`
   - **Redis** at `localhost:6379`

3. **Verify**:
   Visit `http://localhost:3000`. You should see the dashboard showing "System Status: ok".

## Option 2: Manual Installation (Local Dev)

If you prefer to run services individually:

### 1. Start Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env file
echo "REDIS_HOST=localhost" > .env
echo "REDIS_PORT=6379" >> .env

# Run Server
uvicorn app.main:app --reload --port 8000
```

### 3. Dashboard Setup
```bash
cd dashboard
npm install

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:8000" > .env

# Run Dev Server
npm run dev
```

Visit `http://localhost:5173` (default Vite port) for the dashboard.
