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

# Disable external services for tests
os.environ.setdefault("ENABLE_RATE_LIMITING", "False")
os.environ.setdefault("ENABLE_METRICS", "False")
os.environ.setdefault("ENABLE_MULTITENANT", "False") # Optional, simplify if needed

# Ensure backend package is importable from root
root_dir = Path(__file__).parent.parent.parent  # mekong-cli root
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import asyncio
from typing import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ========== Async Fixtures ==========


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ========== Mock Fixtures ==========


@pytest.fixture(autouse=True)
def mock_redis():
    """Mock Redis client globally to prevent connection errors."""
    # Sync Redis Mock
    sync_redis = MagicMock()
    sync_redis.get.return_value = None
    sync_redis.set.return_value = True
    sync_redis.setex.return_value = True
    sync_redis.delete.return_value = 1
    sync_redis.incr.return_value = 1
    sync_redis.expire.return_value = True
    sync_redis.ttl.return_value = 3600
    sync_redis.exists.return_value = 0
    sync_redis.keys.return_value = []
    sync_redis.mget.return_value = []
    sync_redis.pipeline.return_value = sync_redis
    sync_redis.execute.return_value = []
    sync_redis.ping.return_value = True
    sync_redis.llen.return_value = 0
    sync_redis.lpush.return_value = 1
    sync_redis.rpush.return_value = 1
    sync_redis.lpop.return_value = None
    sync_redis.rpop.return_value = None
    sync_redis.zadd.return_value = 1
    sync_redis.zrange.return_value = []
    sync_redis.zrem.return_value = 1
    sync_redis.hget.return_value = None
    sync_redis.hset.return_value = 1
    sync_redis.hgetall.return_value = {}

    # Async Redis Mock
    async_redis = AsyncMock()
    async_redis.get.return_value = None
    async_redis.set.return_value = True
    async_redis.setex.return_value = True
    async_redis.delete.return_value = 1
    async_redis.incr.return_value = 1
    async_redis.expire.return_value = True
    async_redis.ttl.return_value = 3600
    async_redis.exists.return_value = 0
    async_redis.keys.return_value = []
    async_redis.mget.return_value = []
    async_redis.pipeline.return_value = async_redis
    async_redis.execute.return_value = []
    async_redis.ping.return_value = True
    async_redis.llen.return_value = 0
    async_redis.lpush.return_value = 1
    async_redis.rpush.return_value = 1
    async_redis.lpop.return_value = None
    async_redis.rpop.return_value = None
    async_redis.zadd.return_value = 1
    async_redis.zrange.return_value = []
    async_redis.zrem.return_value = 1
    async_redis.hget.return_value = None
    async_redis.hset.return_value = 1
    async_redis.hgetall.return_value = {}

    # Handle context manager for async pipeline
    async def async_pipeline_context():
        return async_redis
    async_redis.pipeline.return_value.__aenter__ = async_pipeline_context
    async_redis.pipeline.return_value.__aexit__ = AsyncMock()

    # Patch redis module
    with patch("redis.Redis", return_value=sync_redis), \
         patch("redis.from_url", return_value=sync_redis), \
         patch("redis.asyncio.Redis", return_value=async_redis), \
         patch("redis.asyncio.from_url", return_value=async_redis), \
         patch("backend.core.infrastructure.redis.redis_client", async_redis), \
         patch("backend.services.redis_client.redis_service._client", async_redis), \
         patch("backend.services.ip_blocker.ip_blocker.redis", async_redis), \
         patch("backend.services.rate_limit_monitor.rate_limit_monitor.redis", async_redis), \
         patch("backend.services.rate_limiter_service.RateLimiterService.check_sliding_window", new_callable=AsyncMock, return_value=(True, 100)), \
         patch("backend.services.rate_limiter_service.RateLimiterService.check_token_bucket", new_callable=AsyncMock, return_value=(True, 100)), \
         patch("backend.services.rate_limiter_service.RateLimiterService.check_fixed_window", new_callable=AsyncMock, return_value=(True, 100)), \
         patch("backend.services.rate_limiter_service.RateLimiterService.get_reset_time", new_callable=AsyncMock, return_value=1234567890), \
         patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock, return_value=False), \
         patch("backend.services.ip_blocker.IpBlocker.block_ip", new_callable=AsyncMock), \
         patch("backend.services.rate_limit_monitor.RateLimitMonitor.log_violation", new_callable=AsyncMock), \
         patch("backend.services.rate_limit_monitor.RateLimitMonitor._check_ddos_threshold", new_callable=AsyncMock):
            yield {"sync": sync_redis, "async": async_redis}



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
