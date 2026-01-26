# Webhook Manager Kit ($57)

A robust, self-hosted webhook management solution for modern applications. Receive, verify, queue, and deliver webhooks with confidence.

## Features

- **Universal Receiver**: Built-in support for Stripe, GitHub, Shopify, and Gumroad with signature verification.
- **Reliable Delivery**: Redis-backed event queue with automatic retries and exponential backoff.
- **Dashboard UI**: React-based dashboard to monitor events, deliveries, and manage endpoints.
- **Event Filtering**: Route events to specific endpoints based on event types.
- **Manual Retry**: Re-queue failed deliveries with a single click.
- **Developer Tools**: Mock sender script for local testing.

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Redis (required for queue)

### Backend Setup

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install poetry
   poetry install
   ```
   *Alternatively, install directly with pip using requirements (generated from poetry).*

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env to set DATABASE_URL, REDIS_URL, and Provider Secrets
   ```

4. Initialize the database:
   ```bash
   python -m app.db.init_db
   ```

5. Start the worker (for queue processing):
   ```bash
   arq app.worker.WorkerSettings
   ```

6. Start the API server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

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

See `docs/PROVIDERS.md` for details on configuring Stripe, GitHub, Shopify, and Gumroad secrets.

## Testing

Use the included mock sender to test webhooks locally:

```bash
python scripts/mock_sender.py --provider stripe --event payment_intent.succeeded
```

See `docs/DEBUGGING.md` for troubleshooting.

## Documentation

- [API Documentation](docs/API.md)
- [Provider Configuration](docs/PROVIDERS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Guide](docs/SECURITY.md)

## License

Commercial License.

