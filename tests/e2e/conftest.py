"""E2E test configuration for Mekong CLI."""

import pytest
from fastapi.testclient import TestClient

from src.gateway import app


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI gateway app."""
    with TestClient(app) as c:
        yield c
