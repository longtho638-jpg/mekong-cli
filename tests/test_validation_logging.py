"""
Tests for Validation Logger — ROIaaS Phase 6e

Test validation logging, stats, and analytics.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock

from src.raas.validation_logger import (
    ValidationLogger,
    ValidationLog,
    log_validation,
)


class TestValidationLog:
    """Test ValidationLog dataclass."""

    def test_create_validation_log(self):
        """Should create log with required fields."""
        log = ValidationLog(
            key_id="test-key",
            result="success",
            command="cook",
            duration_ms=150.5,
        )
        assert log.key_id == "test-key"
        assert log.result == "success"
        assert log.command == "cook"
        assert log.duration_ms == 150.5
        assert log.offline_mode is False

    def test_create_offline_validation_log(self):
        """Should create log with offline mode fields."""
        log = ValidationLog(
            key_id="test-key",
            result="offline_grace",
            command="cook",
            offline_mode=True,
            grace_period_remaining=43200,
        )
        assert log.offline_mode is True
        assert log.grace_period_remaining == 43200
        assert log.result == "offline_grace"

    def test_create_failed_validation_log(self):
        """Should create log with error details."""
        log = ValidationLog(
            key_id="test-key",
            result="failed",
            command="agi",
            error_type="quota_exceeded",
            duration_ms=50.0,
        )
        assert log.result == "failed"
        assert log.error_type == "quota_exceeded"


class TestValidationLogger:
    """Test ValidationLogger class."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database connection."""
        db = MagicMock()
        db.fetch_one = AsyncMock()
        db.fetch_all = AsyncMock()
        return db

    @pytest.fixture
    def logger(self, mock_db):
        """Create logger with mock DB."""
        return ValidationLogger(db=mock_db)

    @pytest.mark.asyncio
    async def test_log_validation_success(self, logger, mock_db):
        """Should log successful validation."""
        mock_db.fetch_one.return_value = {"id": 1, "created_at": datetime.now(timezone.utc)}

        log = ValidationLog(
            key_id="test-key",
            result="success",
            command="cook",
            duration_ms=150.0,
        )

        result = await logger.log_validation(log)

        assert result["id"] == 1
        assert mock_db.fetch_one.called

    @pytest.mark.asyncio
    async def test_log_validation_offline_mode(self, logger, mock_db):
        """Should log offline mode validation."""
        mock_db.fetch_one.return_value = {"id": 2, "created_at": datetime.now(timezone.utc)}

        log = ValidationLog(
            key_id="test-key",
            result="offline_grace",
            command="cook",
            offline_mode=True,
            grace_period_remaining=43200,
        )

        await logger.log_validation(log)

        # Verify offline mode fields were passed
        call_args = mock_db.fetch_one.call_args[0][1]
        assert call_args[5] is True  # offline_mode
        assert call_args[6] == 43200  # grace_period_remaining

    @pytest.mark.asyncio
    async def test_log_validation_with_error(self, logger, mock_db):
        """Should log failed validation with error type."""
        mock_db.fetch_one.return_value = {"id": 3, "created_at": datetime.now(timezone.utc)}

        log = ValidationLog(
            key_id="test-key",
            result="failed",
            command="agi",
            error_type="invalid_license",
            duration_ms=25.0,
        )

        await logger.log_validation(log)

        call_args = mock_db.fetch_one.call_args[0][1]
        assert call_args[4] == "invalid_license"  # error_type

    @pytest.mark.asyncio
    async def test_get_validations_by_key(self, logger, mock_db):
        """Should retrieve validations for specific key."""
        mock_data = [
            {"id": 1, "key_id": "test-key", "result": "success"},
            {"id": 2, "key_id": "test-key", "result": "failed"},
        ]
        mock_db.fetch_all.return_value = mock_data

        results = await logger.get_validations_by_key("test-key", days=7, limit=50)

        assert len(results) == 2
        assert results[0]["result"] == "success"
        assert mock_db.fetch_all.called

    @pytest.mark.asyncio
    async def test_get_validation_stats(self, logger, mock_db):
        """Should calculate validation statistics."""
        # Helper to create async side effect
        async def fetch_one_side_effect(query, *args):
            # Return different values based on query content
            if "COUNT(*) as total" in query:
                return {"total": 100}
            elif "success_count" in query:
                return {"success_count": 85}
            elif "offline_count" in query:
                return {"offline_count": 5}
            elif "AVG(duration_ms)" in query:
                return {"avg_duration": 125.5}
            elif "ORDER BY validated_at DESC" in query and "LIMIT" in query:
                return {"id": 99, "result": "success"}
            return None

        mock_db.fetch_one.side_effect = fetch_one_side_effect
        mock_db.fetch_all.side_effect = [
            [
                {"result": "success", "count": 85},
                {"result": "failed", "count": 10},
                {"result": "offline_grace", "count": 5},
            ],
            [
                {"error_type": "quota_exceeded", "count": 5},
                {"error_type": "invalid_license", "count": 3},
            ],
        ]

        stats = await logger.get_validation_stats("test-key", days=30)

        assert stats["total_validations"] == 100
        assert stats["success_count"] == 85
        assert stats["success_rate"] == 85.0
        assert stats["offline_count"] == 5
        assert stats["by_error"] == {"quota_exceeded": 5, "invalid_license": 3}

    @pytest.mark.asyncio
    async def test_get_failed_validations(self, logger, mock_db):
        """Should retrieve only failed validations."""
        mock_data = [
            {"id": 1, "key_id": "test-key", "result": "failed", "error_type": "quota_exceeded"},
            {"id": 2, "key_id": "test-key", "result": "failed", "error_type": "revoked"},
        ]
        mock_db.fetch_all.return_value = mock_data

        results = await logger.get_failed_validations("test-key", days=7)

        assert len(results) == 2
        assert all(r["result"] == "failed" for r in results)

    @pytest.mark.asyncio
    async def test_get_recent_validations(self, logger, mock_db):
        """Should retrieve recent validations across all keys."""
        mock_data = [
            {"id": 1, "key_id": "key-1", "result": "success"},
            {"id": 2, "key_id": "key-2", "result": "offline_grace"},
        ]
        mock_db.fetch_all.return_value = mock_data

        results = await logger.get_recent_validations(limit=100, hours=24)

        assert len(results) == 2
        assert mock_db.fetch_all.called


class TestValidationLogResult:
    """Test validation result types."""

    @pytest.mark.parametrize("result", [
        "success",
        "failed",
        "offline_grace",
        "revoked",
        "expired",
    ])
    def test_result_types(self, result):
        """Should accept all result types."""
        log = ValidationLog(
            key_id="test-key",
            result=result,
            command="cook",
        )
        assert log.result == result

    @pytest.mark.parametrize("error_type", [
        None,
        "invalid_format",
        "network_error",
        "quota_exceeded",
        "rate_limit",
        "revoked",
        "expired",
        "grace_period_expired",
    ])
    def test_error_types(self, error_type):
        """Should accept all error types."""
        log = ValidationLog(
            key_id="test-key",
            result="failed",
            command="cook",
            error_type=error_type,
        )
        assert log.error_type == error_type


class TestGlobalLogger:
    """Test global logger singleton."""

    @patch("src.raas.validation_logger._logger", None)
    def test_get_logger_creates_singleton(self):
        """Should create singleton logger instance."""
        # Force re-import by setting to None
        import importlib
        import src.raas.validation_logger as module
        importlib.reload(module)

        logger = module.get_logger()
        assert logger is not None

    @patch("src.raas.validation_logger.get_logger")
    @pytest.mark.asyncio
    async def test_log_validation_helper(self, mock_get_logger):
        """Should use global logger for helper function."""
        mock_logger = MagicMock()
        mock_logger.log_validation = AsyncMock(return_value={"id": 1})
        mock_get_logger.return_value = mock_logger

        log = ValidationLog(
            key_id="test-key",
            result="success",
            command="cook",
        )

        result = await log_validation(log)

        assert result["id"] == 1
        assert mock_logger.log_validation.called
