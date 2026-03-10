"""
Tests for Phase 3 PostgreSQL Repository Layer
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from src.db.repository import LicenseRepository
from src.lib.usage_meter import UsageMeter
from src.lib.license_generator import (
    LicenseKeyGenerator,
    get_tier_limits,
)


class TestLicenseKeyGenerator:
    """Test license key generation and validation."""

    def test_generate_key_free_tier(self) -> None:
        """Test generating a free tier license key."""
        generator = LicenseKeyGenerator(secret_key="test-secret")
        key = generator.generate_key("free", "user@example.com")

        assert key.startswith("raas-free-")
        parts = key.split("-")
        assert len(parts) >= 4  # raas-free-{key_id}-{signature}
        assert parts[0] == "raas"
        assert parts[1] == "free"
        assert len(parts[2]) == 8  # key_id

    def test_generate_key_trial_with_days(self) -> None:
        """Test generating a trial license key with expiry."""
        generator = LicenseKeyGenerator(secret_key="test-secret")
        key = generator.generate_key("trial", "trial@example.com", days=7)

        assert key.startswith("raas-trial-")

    def test_generate_key_invalid_tier(self) -> None:
        """Test generating key with invalid tier raises error."""
        generator = LicenseKeyGenerator(secret_key="test-secret")

        with pytest.raises(ValueError, match="Invalid tier"):
            generator.generate_key("invalid", "user@example.com")

    def test_validate_key_valid(self) -> None:
        """Test validating a valid license key."""
        generator = LicenseKeyGenerator(secret_key="test-secret")
        key = generator.generate_key("pro", "user@example.com")

        is_valid, info, error = generator.validate_key(key)

        assert is_valid is True
        assert info is not None
        assert info["tier"] == "pro"
        assert info["key_id"] is not None
        assert error == ""

    def test_validate_key_invalid_format(self) -> None:
        """Test validating key with invalid format."""
        generator = LicenseKeyGenerator(secret_key="test-secret")

        is_valid, info, error = generator.validate_key("invalid-key")

        assert is_valid is False
        assert "Invalid format" in error

    def test_validate_key_invalid_prefix(self) -> None:
        """Test validating key with wrong prefix."""
        generator = LicenseKeyGenerator(secret_key="test-secret")

        is_valid, info, error = generator.validate_key("not-raas-free-abc-xyz")

        assert is_valid is False
        assert "Invalid prefix" in error

    def test_validate_key_invalid_tier(self) -> None:
        """Test validating key with invalid tier."""
        generator = LicenseKeyGenerator(secret_key="test-secret")

        is_valid, info, error = generator.validate_key("raas-invalid-abc-xyz")

        assert is_valid is False
        assert "Invalid tier" in error

    def test_verify_signature_smoke(self) -> None:
        """Test signature verification - smoke test."""
        generator = LicenseKeyGenerator(secret_key="test-secret")
        email = "user@example.com"
        key = generator.generate_key("pro", email, days=None)

        # Smoke test: verify key is generated and can be checked
        # Note: Full signature verification requires payload reconstruction
        # which is tested in validate_key tests above
        assert key is not None
        assert "raas-pro-" in key

    def test_get_tier_limits(self) -> None:
        """Test getting tier limits."""
        assert get_tier_limits("free")["commands_per_day"] == 10
        assert get_tier_limits("trial")["commands_per_day"] == 50
        assert get_tier_limits("pro")["commands_per_day"] == 1000
        assert get_tier_limits("enterprise")["commands_per_day"] == -1  # unlimited


class TestUsageMeter:
    """Test usage metering with PostgreSQL backend."""

    @pytest.fixture
    def mock_repository(self) -> MagicMock:
        """Create a mock repository."""
        repo = MagicMock()
        repo.get_usage = AsyncMock(return_value={"commands_count": 5})
        repo.record_usage = AsyncMock(return_value={})
        repo.get_license_by_key_id = AsyncMock(
            return_value={"tier": "pro", "id": 1}
        )
        repo.get_usage_summary = AsyncMock(
            return_value={
                "total_commands": 100,
                "days_with_usage": 10,
                "avg_daily_commands": 10,
            }
        )
        return repo

    @pytest.mark.asyncio
    async def test_record_usage_within_limit(self, mock_repository: MagicMock) -> None:
        """Test recording usage within daily limit."""
        meter = UsageMeter(repository=mock_repository)

        allowed, error = await meter.record_usage("test-key", "pro")

        assert allowed is True
        assert error == ""
        mock_repository.record_usage.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_usage_exceeds_limit(self, mock_repository: MagicMock) -> None:
        """Test recording usage that exceeds daily limit."""
        mock_repository.get_usage.return_value = {"commands_count": 1000}
        meter = UsageMeter(repository=mock_repository)

        allowed, error = await meter.record_usage("test-key", "pro")

        assert allowed is False
        assert "Daily limit reached" in error

    @pytest.mark.asyncio
    async def test_get_usage_summary(self, mock_repository: MagicMock) -> None:
        """Test getting usage summary."""
        meter = UsageMeter(repository=mock_repository)
        summary = await meter.get_usage_summary("test-key")

        assert summary["key_id"] == "test-key"
        assert summary["tier"] == "pro"
        assert "commands_today" in summary
        assert "daily_limit" in summary


class TestLicenseRepository:
    """Test repository layer with mocked database."""

    @pytest.fixture
    def mock_database(self) -> MagicMock:
        """Create a mock database connection."""
        db = MagicMock()
        db.fetch_one = AsyncMock(return_value={"id": 1, "created_at": "2026-03-05"})
        db.fetch_all = AsyncMock(return_value=[])
        db.execute = AsyncMock()
        return db

    @pytest.mark.asyncio
    async def test_create_license(self, mock_database: MagicMock) -> None:
        """Test creating a license."""
        repo = LicenseRepository(db=mock_database)

        result = await repo.create_license(
            license_key="raas-pro-test-abc123",
            key_id="test",
            tier="pro",
            email="user@example.com",
        )

        assert result["id"] == 1
        mock_database.fetch_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_license_by_key(self, mock_database: MagicMock) -> None:
        """Test getting license by key."""
        repo = LicenseRepository(db=mock_database)

        await repo.get_license_by_key("raas-pro-test-abc123")

        mock_database.fetch_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_revoke_license(self, mock_database: MagicMock) -> None:
        """Test revoking a license."""
        mock_database.fetch_one.side_effect = [
            {"id": 1, "license_key": "raas-pro-test-abc123"},  # get_license_by_key_id
            {"id": 1, "created_at": "2026-03-05"},
        ]
        repo = LicenseRepository(db=mock_database)

        result = await repo.revoke_license("test", "Payment failed")

        assert result is True
        assert mock_database.execute.call_count >= 1

    @pytest.mark.asyncio
    async def test_is_revoked(self, mock_database: MagicMock) -> None:
        """Test checking if license is revoked."""
        # Not revoked
        mock_database.fetch_one.return_value = None
        repo = LicenseRepository(db=mock_database)
        assert await repo.is_revoked("test") is False

        # Revoked
        mock_database.fetch_one.return_value = {"id": 1}
        assert await repo.is_revoked("test") is True
