# Testing Guide

Quality is paramount. This guide explains the testing strategy for the Email Marketing Kit.

## 🧪 Test Structure

Tests are located in the `tests/` directory.

- `tests/conftest.py`: Fixtures for database, async client, and sample data.
- `tests/test_api.py`: Integration tests for API endpoints.
- `tests/test_subscribers.py`: Tests for subscriber logic.
- `tests/test_templates.py`: Tests for template rendering.

## ⚙️ Running Tests

Prerequisite: Ensure your virtual environment is active and dependencies are installed.

```bash
# Standard run
pytest

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

## 🎯 Coverage

We aim for high test coverage, particularly for business logic and API endpoints.

```bash
pytest --cov=app --cov-report=term-missing tests/
```

## 🧩 Mocking

External services (Email Providers) are mocked to prevent sending real emails during testing.

We use `unittest.mock` and `pytest-asyncio`.

**Example:**
```python
from unittest.mock import AsyncMock, patch

@patch("app.providers.smtp.SMTPProvider.send")
async def test_send_email(mock_send, client):
    # Perform action
    assert mock_send.called
```

## ✅ Continuous Integration

Tests are automatically run on every Pull Request via GitHub Actions. Ensure all tests pass locally before pushing.
