from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.models.rate_limit import IpBlocklist
from backend.services.ip_blocker import IpBlocker


@pytest.fixture
def mock_redis():
    return AsyncMock()

@pytest.fixture
def ip_blocker(mock_redis):
    blocker = IpBlocker()
    blocker.redis = mock_redis
    return blocker

@pytest.mark.asyncio
async def test_is_blocked_redis_hit(ip_blocker, mock_redis):
    mock_redis.get.return_value = "1"

    assert await ip_blocker.is_blocked("1.2.3.4") is True
    mock_redis.get.assert_called_with("rate_limit:blocked_ip:1.2.3.4")

@pytest.mark.asyncio
async def test_is_blocked_redis_miss(ip_blocker, mock_redis):
    mock_redis.get.return_value = None

    assert await ip_blocker.is_blocked("1.2.3.4") is False

@pytest.mark.asyncio
async def test_block_ip(ip_blocker, mock_redis):
    with patch('backend.services.ip_blocker.SessionLocal') as MockSession:
        db = MockSession.return_value.__enter__.return_value
        # Mock scalar_one_or_none for existing check
        db.execute.return_value.scalar_one_or_none.return_value = None

        await ip_blocker.block_ip("1.2.3.4", reason="bad bot", duration_seconds=60)

        # Verify redis set
        mock_redis.setex.assert_called_with("rate_limit:blocked_ip:1.2.3.4", 60, "1")

        # Verify DB add
        assert db.add.called
        assert db.commit.called

@pytest.mark.asyncio
async def test_unblock_ip(ip_blocker, mock_redis):
    with patch('backend.services.ip_blocker.SessionLocal') as MockSession:
        db = MockSession.return_value.__enter__.return_value
        # Mock existing record
        mock_record = MagicMock(spec=IpBlocklist)
        db.execute.return_value.scalar_one_or_none.return_value = mock_record

        await ip_blocker.unblock_ip("1.2.3.4")

        # Verify redis delete
        mock_redis.delete.assert_called_with("rate_limit:blocked_ip:1.2.3.4")

        # Verify DB update
        assert mock_record.is_active is False
        assert db.commit.called
