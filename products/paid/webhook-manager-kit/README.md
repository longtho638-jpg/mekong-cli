# Webhook Manager Kit ($37)

A robust, self-hosted webhook management solution for modern applications.

## Features

- **Endpoint Management**: Register and manage webhook endpoints via API or UI.
- **Reliable Delivery**: Automatic retries with exponential backoff (3 attempts).
- **Security**: HMAC SHA256 signature verification for every payload.
- **Observability**: Detailed delivery logs, request/response history, and timing.
- **Recovery**: Dashboard to view failed webhooks and manually trigger retries.

## Quick Start

### Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install poetry
   poetry install
   ```
3. Initialize the database:
   ```bash
   python -m app.db.init_db
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## Configuration

Backend configuration is managed via `.env` file (or environment variables).
See `backend/app/core/config.py` for defaults.

- `DATABASE_URL`: SQLite by default, supports PostgreSQL.
- `SECRET_KEY`: Change this in production!
- `MAX_RETRIES`: Default is 3.

## Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend tests:
```bash
cd frontend
npm test
```

## License

Commercial License.
