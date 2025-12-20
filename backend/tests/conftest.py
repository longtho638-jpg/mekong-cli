"""
Pytest Configuration for Backend Tests
Agency OS v2.0 - WIN-WIN-WIN Testing
"""

import pytest
import asyncio
from typing import Generator
from unittest.mock import AsyncMock, MagicMock


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
