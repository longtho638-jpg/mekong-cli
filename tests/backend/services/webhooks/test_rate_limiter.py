from unittest.mock import MagicMock

import pytest
import redis

from backend.services.webhooks.rate_limiter import RateLimiter


class TestRateLimiter:

    @pytest.fixture
    def mock_redis(self):
        return MagicMock(spec=redis.Redis)

    @pytest.fixture
    def limiter(self, mock_redis):
        return RateLimiter(mock_redis)

    def test_is_allowed_success(self, limiter, mock_redis):
        # Mock EVAL returning 1 (True/Allowed)
        mock_redis.execute_command.return_value = 1

        allowed = limiter.is_allowed("test_key", 10, 50)

        assert allowed is True
        mock_redis.execute_command.assert_called_once()
        args = mock_redis.execute_command.call_args[0]
        assert args[0] == 'EVAL'
        assert args[2] == 2 # numkeys

    def test_is_allowed_failure(self, limiter, mock_redis):
        # Mock EVAL returning 0 (False/Denied)
        mock_redis.execute_command.return_value = 0

        allowed = limiter.is_allowed("test_key", 10, 50)

        assert allowed is False

    def test_redis_error_fallback(self, limiter, mock_redis):
        # Should fail open (allow) if Redis is down
        mock_redis.execute_command.side_effect = redis.RedisError("Connection failed")

        allowed = limiter.is_allowed("test_key", 10, 50)

        assert allowed is True
