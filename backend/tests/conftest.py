"""
Pytest Configuration for Backend Tests
Agency OS v2.0 - WIN-WIN-WIN Testing
"""

import os
import sys
from pathlib import Path

# ========== CRITICAL: Set environment variables BEFORE any backend imports ==========
# These must be set at module level (not in fixture) because backend modules check them at import time

# Required for auth module (checked in backend/api/auth/utils.py at import)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only-do-not-use-in-production")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

# Payment webhooks (prevents import errors in webhook routes)
os.environ.setdefault("GUMROAD_WEBHOOK_SECRET", "test-gumroad-webhook-secret-for-testing")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "test-stripe-webhook-secret-for-testing")

# Database (if needed)
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

# Ensure backend package is importable from root
root_dir = Path(__file__).parent.parent.parent  # mekong-cli root
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import asyncio
from typing import Generator
from unittest.mock import AsyncMock

import pytest

# ========== Async Fixtures ==========


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ========== Mock Fixtures ==========


@pytest.fixture
def mock_llm_response():
    """Mock LLM API response for testing without external calls."""
    return {
        "choices": [{"message": {"content": "Mock AI response for testing"}}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 20},
    }


@pytest.fixture
def mock_async_client():
    """Mock async HTTP client."""
    client = AsyncMock()
    client.get = AsyncMock()
    client.post = AsyncMock()
    return client


# ========== Sample Data Fixtures ==========


@pytest.fixture
def sample_lead():
    """Sample lead for SDROps testing."""
    return {
        "id": "LEAD-001",
        "name": "Test Company",
        "email": "test@example.com",
        "source": "inbound",
        "score": 75,
        "status": "new",
    }


@pytest.fixture
def sample_content_draft():
    """Sample content draft for EditorOps testing."""
    return {
        "id": "DRAFT-001",
        "title": "Test Article",
        "body": "This is test content for the editor agent.",
        "platform": "blog",
        "status": "draft",
    }


@pytest.fixture
def sample_meeting():
    """Sample meeting for MeetingBooker testing."""
    return {
        "id": "MTG-001",
        "title": "Discovery Call",
        "attendees": ["test@example.com"],
        "datetime": "2024-12-20T10:00:00Z",
        "status": "scheduled",
    }


# ========== WIN-WIN-WIN Verification ==========


@pytest.fixture
def win_check():
    """Helper to verify WIN-WIN-WIN outcomes in tests."""

    def check(owner_benefit: str, agency_benefit: str, startup_benefit: str) -> bool:
        return all([owner_benefit, agency_benefit, startup_benefit])

    return check
