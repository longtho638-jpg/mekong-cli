# AgencyOS API Service

The API service is the entry point for the AgencyOS Money Layer. It is built with **FastAPI** and provides RESTful endpoints for managing users, wallets, transactions, and credit packs.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (Async with SQLAlchemy + Alembic)
- **Validation**: Pydantic
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Poetry (for dependency management)

### Local Development

1. **Install Dependencies**:
   ```bash
   poetry install
   ```

2. **Run Migrations**:
   ```bash
   # Generate migration
   poetry run alembic revision --autogenerate -m "Initial migration"

   # Apply migration
   poetry run alembic upgrade head
   ```

3. **Start Server**:
   ```bash
   poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Docker

Build and run via the infrastructure Makefile:

```bash
cd ../../infrastructure
make deploy-local
```

## Project Structure

```
apps/api/
├── alembic/            # Database migrations
├── src/
│   ├── models.py       # Database models (User, Wallet, Transaction)
│   ├── config.py       # Environment configuration
│   ├── database.py     # Database connection & session
│   └── routers/        # API endpoints
├── main.py             # App entry point
├── Dockerfile          # Production Dockerfile
└── pyproject.toml      # Dependencies
```
