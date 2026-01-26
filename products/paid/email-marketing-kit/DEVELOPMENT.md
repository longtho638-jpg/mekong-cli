# Development Guide

This guide will help you set up your local development environment for contributing to the Email Marketing Kit.

## 🛠️ Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-repo/email-marketing-kit.git
    cd email-marketing-kit
    ```

2.  **Python Environment**
    We recommend using `venv` or `poetry`.
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Database & Redis**
    You can run dependencies via Docker while running the app locally.
    ```bash
    docker-compose up -d db redis
    ```

4.  **Environment Variables**
    ```bash
    cp .env.example .env
    # Edit .env to point to localhost DB: postgresql+asyncpg://postgres:postgres@localhost:5432/email_kit
    ```

5.  **Run Migrations**
    ```bash
    alembic upgrade head
    ```

6.  **Run the Application**
    ```bash
    uvicorn app.main:app --reload
    ```

## 🗂️ Project Structure

- `app/api`: API route definitions.
- `app/core`: Configuration and database setup.
- `app/models`: SQLAlchemy ORM models.
- `app/schemas`: Pydantic data schemas.
- `app/services`: Business logic (Dispatcher, Template Service).
- `app/providers`: Email provider implementations.
- `tests`: Pytest test suite.
- `alembic`: Database migration scripts.

## 🧪 Running Tests

We use `pytest` for testing.

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## 📦 Database Migrations

When you modify models in `app/models/`, you need to create a migration.

```bash
# Create migration
alembic revision --autogenerate -m "describe_changes"

# Apply migration
alembic upgrade head
```

## 🤝 Contributing

1.  Create a feature branch (`git checkout -b feature/amazing-feature`).
2.  Commit your changes (`git commit -m 'Add amazing feature'`).
3.  Push to the branch (`git push origin feature/amazing-feature`).
4.  Open a Pull Request.
