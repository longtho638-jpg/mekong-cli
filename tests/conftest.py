"""
Pytest global fixtures and configuration.

Provides:
- Redis mock fixture for CI-friendly tests
- Test configuration utilities
"""

import os
import pytest
from unittest.mock import MagicMock, patch
from typing import Generator


def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers",
        "redis: marks tests as requiring Redis connection"
    )
    config.addinivalue_line(
        "markers",
        "integration: marks integration tests (slower, external deps)"
    )
    config.addinivalue_line(
        "markers",
        "unit: marks unit tests (fast, isolated)"
    )


@pytest.fixture(scope="function")
def mock_redis() -> Generator[MagicMock, None, None]:
    """
    Mock Redis client for CI-friendly unit tests.

    Usage:
        def test_something(mock_redis):
            # Redis calls will use this mock
            pass

    Or skip tests requiring real Redis:
        @pytest.mark.redis
        def test_redis_required():
            # Only runs when --redis flag passed
            pass
    """
    mock = MagicMock()

    # Mock Redis client methods commonly used
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = 1
    mock.exists.return_value = False
    mock.ttl.return_value = -1
    mock.expire.return_value = True

    # Mock pipeline
    pipeline_mock = MagicMock()
    pipeline_mock.execute.return_value = []
    mock.pipeline.return_value = pipeline_mock

    # Mock pubsub
    pubsub_mock = MagicMock()
    mock.pubsub.return_value = pubsub_mock

    # Mock scan_iter
    mock.scan_iter.return_value = []

    with patch('redis.Redis', return_value=mock):
        with patch('redis.from_url', return_value=mock):
            yield mock


@pytest.fixture(scope="function")
def mock_redis_connection() -> Generator[dict, None, None]:
    """
    Mock Redis connection info for tests.

    Returns a dict with mock connection parameters.
    """
    return {
        "host": "localhost",
        "port": 6379,
        "db": 0,
        "decode_responses": True,
    }


@pytest.fixture(scope="function")
def disable_redis() -> Generator[None, None, None]:
    """
    Disable Redis entirely for tests that don't need it.

    Sets REDIS_URL to empty string and mocks all Redis imports.
    """
    os.environ["REDIS_URL"] = ""

    with patch('redis.Redis', MagicMock()):
        with patch('redis.from_url', MagicMock()):
            with patch('redis.asyncio.Redis', MagicMock()):
                with patch('redis.asyncio.from_url', MagicMock()):
                    yield


@pytest.fixture(scope="session")
def test_config():
    """Test configuration."""
    return {
        "redis_enabled": False,
        "test_mode": True,
    }


# Hook to skip redis-marked tests by default
def pytest_collection_modifyitems(config, items):
    """Skip tests marked as 'redis' unless --redis flag is passed."""
    if not config.getoption("--redis", default=False):
        skip_redis = pytest.mark.skip(reason="Redis not available (use --redis to run)")
        for item in items:
            if "redis" in item.keywords:
                item.add_marker(skip_redis)


def pytest_addoption(parser):
    """Add custom pytest CLI options."""
    parser.addoption(
        "--redis",
        action="store_true",
        default=False,
        help="Run tests that require Redis connection"
    )
    parser.addoption(
        "--integration",
        action="store_true",
        default=False,
        help="Run integration tests (slower)"
    )
