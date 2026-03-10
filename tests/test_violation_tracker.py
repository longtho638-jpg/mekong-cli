"""Tests for ViolationTracker — ROIaaS Phase 6 enforcement layer."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.raas.violation_tracker import (
    ViolationEvent,
    ViolationTracker,
    get_tracker,
    record_violation,
)


# ---------------------------------------------------------------------------
# Test: ViolationEvent creation and serialization
# ---------------------------------------------------------------------------


def test_violation_event_creation() -> None:
    """Test ViolationEvent dataclass creation with all fields."""
    event = ViolationEvent(
        key_id="test-key-123",
        tier="pro",
        violation_type="rate_limit",
        command="cook",
        daily_used=100,
        daily_limit=1000,
        monthly_used=5000,
        monthly_limit=50000,
        retry_after_seconds=3600,
        metadata={"ip": "192.168.1.1", "user_agent": "test"},
    )

    assert event.key_id == "test-key-123"
    assert event.tier == "pro"
    assert event.violation_type == "rate_limit"
    assert event.command == "cook"
    assert event.daily_used == 100
    assert event.daily_limit == 1000
    assert event.monthly_used == 5000
    assert event.monthly_limit == 50000
    assert event.retry_after_seconds == 3600
    assert event.metadata == {"ip": "192.168.1.1", "user_agent": "test"}


def test_violation_event_with_minimal_fields() -> None:
    """Test ViolationEvent with only required fields."""
    event = ViolationEvent(
        key_id="test-key",
        tier="trial",
        violation_type="quota_exceeded",
        command="generate",
    )

    assert event.key_id == "test-key"
    assert event.tier == "trial"
    assert event.violation_type == "quota_exceeded"
    assert event.command == "generate"
    assert event.daily_used == 0
    assert event.daily_limit == 0
    assert event.monthly_used == 0
    assert event.monthly_limit == 0
    assert event.retry_after_seconds is None
    assert event.metadata is None


def test_violation_event_asdict() -> None:
    """Test dataclass asdict conversion."""
    event = ViolationEvent(
        key_id="key-456",
        tier="free",
        violation_type="invalid_license",
        command="init",
    )

    event_dict = vars(event)

    assert event_dict["key_id"] == "key-456"
    assert event_dict["tier"] == "free"
    assert event_dict["violation_type"] == "invalid_license"
    assert event_dict["command"] == "init"


# ---------------------------------------------------------------------------
# Test: ViolationTracker.record_violation()
# ---------------------------------------------------------------------------


@pytest.fixture()
def mock_db() -> MagicMock:
    """Mock database connection."""
    db = MagicMock()
    db.fetch_one = AsyncMock()
    return db


@pytest.fixture()
def mock_repo() -> MagicMock:
    """Mock license repository."""
    return MagicMock()


@pytest.fixture()
def tracker_with_mock_db(mock_db: MagicMock, mock_repo: MagicMock) -> ViolationTracker:
    """ViolationTracker with mocked dependencies."""
    return ViolationTracker(repository=mock_repo, db=mock_db)


@pytest.mark.asyncio
async def test_record_violation_with_rate_limit_event(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test recording a rate limit violation event."""
    event = ViolationEvent(
        key_id="license-key-789",
        tier="starter",
        violation_type="rate_limit",
        command="search",
        daily_used=50,
        daily_limit=50,
        retry_after_seconds=1800,
        metadata={"ip": "10.0.0.1"},
    )

    expected_result = {
        "id": 1,
        "key_id": "license-key-789",
        "tier": "starter",
        "violation_type": "rate_limit",
        "command": "search",
        "daily_used": 50,
        "daily_limit": 50,
        "monthly_used": 0,
        "monthly_limit": 0,
        "retry_after_seconds": 1800,
        "metadata": '{"ip": "10.0.0.1"}',
    }
    mock_db.fetch_one.return_value = expected_result

    result = await tracker_with_mock_db.record_violation(event)

    assert result["id"] == 1
    assert result["key_id"] == "license-key-789"
    assert result["violation_type"] == "rate_limit"
    mock_db.fetch_one.assert_called_once()


@pytest.mark.asyncio
async def test_record_violation_quota_exceeded(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test recording a quota exceeded violation."""
    event = ViolationEvent(
        key_id="trial-key",
        tier="trial",
        violation_type="quota_exceeded",
        command="cook",
        daily_used=50,
        daily_limit=50,
        monthly_used=100,
        monthly_limit=500,
    )

    expected = {"id": 2, "violation_type": "quota_exceeded"}
    mock_db.fetch_one.return_value = expected

    result = await tracker_with_mock_db.record_violation(event)

    assert result["violation_type"] == "quota_exceeded"
    mock_db.fetch_one.assert_called()


@pytest.mark.asyncio
async def test_record_violation_calls_database_correctly(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test that record_violation calls DB with correct SQL and params."""
    event = ViolationEvent(
        key_id="key-id",
        tier="growth",
        violation_type="revoked",
        command="generate",
        daily_used=0,
        daily_limit=200,
    )

    mock_db.fetch_one.return_value = {"id": 3}

    await tracker_with_mock_db.record_violation(event)

    call_args = mock_db.fetch_one.call_args
    query = call_args[0][0]

    assert "INSERT INTO violation_events" in query
    assert "key_id, tier, violation_type, command" in query
    assert "daily_used, daily_limit" in query
    assert "monthly_used, monthly_limit" in query
    assert "retry_after_seconds, metadata, occurred_at" in query

    params = call_args[0][1]
    assert params[0] == "key-id"
    assert params[1] == "growth"
    assert params[2] == "revoked"
    assert params[3] == "generate"
    assert params[4] == 0
    assert params[5] == 200


@pytest.mark.asyncio
async def test_record_violation_handles_empty_metadata(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test recording with None/empty metadata."""
    event = ViolationEvent(
        key_id="key-no-meta",
        tier="pro",
        violation_type="rate_limit",
        command="test",
        metadata=None,
    )

    mock_db.fetch_one.return_value = {"id": 4}

    result = await tracker_with_mock_db.record_violation(event)

    assert result["id"] == 4


@pytest.mark.asyncio
async def test_record_violation_returns_empty_when_no_result(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test return value when DB returns None."""
    mock_db.fetch_one.return_value = None

    result = await tracker_with_mock_db.record_violation(
        ViolationEvent(
            key_id="key",
            tier="free",
            violation_type="quota_exceeded",
            command="test",
        )
    )

    assert result == {}


# ---------------------------------------------------------------------------
# Test: ViolationTracker.get_violations_by_key()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_violations_by_key_queries_database(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_violations_by_key executes correct query."""
    mock_db.fetch_all = AsyncMock(return_value=[])

    await tracker_with_mock_db.get_violations_by_key("key-123", days=30, limit=100)

    call_args = mock_db.fetch_all.call_args
    query = call_args[0][0]

    assert "SELECT * FROM violation_events" in query
    assert "WHERE key_id = $1" in query
    assert "occurred_at >= CURRENT_TIMESTAMP - INTERVAL" in query
    assert "ORDER BY occurred_at DESC" in query
    assert "LIMIT" in query.upper()


@pytest.mark.asyncio
async def test_get_violations_by_key_returns_list(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_violations_by_key returns list of dicts."""
    expected = [
        {"id": 1, "key_id": "key-x", "violation_type": "rate_limit"},
        {"id": 2, "key_id": "key-x", "violation_type": "quota_exceeded"},
    ]
    mock_db.fetch_all = AsyncMock(return_value=expected)

    result = await tracker_with_mock_db.get_violations_by_key("key-x", days=7)

    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["violation_type"] == "rate_limit"
    assert result[1]["violation_type"] == "quota_exceeded"


@pytest.mark.asyncio
async def test_get_violations_by_key_default_params(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_violations_by_key uses default days=30, limit=100."""
    mock_db.fetch_all = AsyncMock(return_value=[])

    await tracker_with_mock_db.get_violations_by_key("key-default")

    call_args = mock_db.fetch_all.call_args
    params = call_args[0][1]
    assert params == ("key-default", 100)


# ---------------------------------------------------------------------------
# Test: ViolationTracker.get_violation_summary()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_violation_summary_queries_all_necessary_data(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_violation_summary executes all required queries."""
    # Mock fetch_all for type count query (first call)
    # Then fetch_one for total (second call)
    # Then fetch_one for last violation (third call)
    mock_db.fetch_all = AsyncMock(return_value=[{"violation_type": "rate_limit", "count": 2}])
    mock_db.fetch_one = AsyncMock(side_effect=[
        {"total": 2},  # total count
        {"id": 1, "violation_type": "rate_limit"},  # last violation
    ])

    result = await tracker_with_mock_db.get_violation_summary("key-summary", days=30)

    assert mock_db.fetch_all.call_count == 1
    assert mock_db.fetch_one.call_count == 2

    assert result["key_id"] == "key-summary"
    assert result["period_days"] == 30


@pytest.mark.asyncio
async def test_get_violation_summary_empty_result(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_violation_summary when no violations found."""
    mock_db.fetch_all = AsyncMock(return_value=[])
    mock_db.fetch_one = AsyncMock(return_value=None)

    result = await tracker_with_mock_db.get_violation_summary("no-violations")

    assert result["total_violations"] == 0
    assert result["violations_by_type"] == {}
    assert result["last_violation"] is None


@pytest.mark.asyncio
async def test_get_violation_summary_with_violations_by_type(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test violations grouped by type."""
    type_results = [
        {"violation_type": "rate_limit", "count": 3},
        {"violation_type": "quota_exceeded", "count": 5},
        {"violation_type": "invalid_license", "count": 1},
    ]
    total_result = {"total": 9}
    last_result = {"id": 99, "violation_type": "rate_limit"}

    mock_db.fetch_all = AsyncMock(return_value=type_results)
    mock_db.fetch_one = AsyncMock(side_effect=[total_result, last_result])

    result = await tracker_with_mock_db.get_violation_summary("key")

    assert result["violations_by_type"]["rate_limit"] == 3
    assert result["violations_by_type"]["quota_exceeded"] == 5
    assert result["violations_by_type"]["invalid_license"] == 1
    assert result["total_violations"] == 9
    assert result["last_violation"]["id"] == 99


# ---------------------------------------------------------------------------
# Test: ViolationTracker.get_all_violations()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_all_violations_admin_query(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_all_violations for admin dashboard."""
    mock_db.fetch_all = AsyncMock(return_value=[])

    await tracker_with_mock_db.get_all_violations(days=7, limit=500)

    call_args = mock_db.fetch_all.call_args
    query = call_args[0][0]

    assert "SELECT * FROM violation_events" in query
    assert "WHERE occurred_at >= CURRENT_TIMESTAMP - INTERVAL" in query
    assert "ORDER BY occurred_at DESC" in query
    assert "LIMIT $1" in query


@pytest.mark.asyncio
async def test_get_all_violations_default_params(
    tracker_with_mock_db: ViolationTracker, mock_db: MagicMock
) -> None:
    """Test get_all_violations uses default days=7, limit=500."""
    mock_db.fetch_all = AsyncMock(return_value=[])

    await tracker_with_mock_db.get_all_violations()

    call_args = mock_db.fetch_all.call_args
    params = call_args[0][1]
    assert params == (500,)


# ---------------------------------------------------------------------------
# Test: Global functions
# ---------------------------------------------------------------------------


def test_get_tracker_returns_singleton() -> None:
    """Test get_tracker returns the same instance."""
    tracker1 = get_tracker()
    tracker2 = get_tracker()

    assert tracker1 is tracker2


@pytest.mark.asyncio
async def test_record_violation_calls_global_tracker() -> None:
    """Test record_violation helper function."""
    tracker_mock = MagicMock()
    tracker_mock.record_violation = AsyncMock(return_value={"id": 1})

    with patch("src.raas.violation_tracker.get_tracker", return_value=tracker_mock):
        result = await record_violation(
            ViolationEvent(
                key_id="test",
                tier="free",
                violation_type="rate_limit",
                command="test",
            )
        )

    assert result["id"] == 1
    tracker_mock.record_violation.assert_called_once()


# ---------------------------------------------------------------------------
# Test: Integration with actual database (when Available)
# ---------------------------------------------------------------------------


@pytest.mark.integration
@pytest.mark.asyncio
async def test_violation_tracker_with_real_db() -> None:
    """Integration test - requires DATABASE_URL environment variable."""
    import os

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        pytest.skip("DATABASE_URL not set - skipping integration test")

    from src.db.database import get_database
    from src.raas.violation_tracker import ViolationTracker

    db = get_database()
    tracker = ViolationTracker(db=db)

    # This is a smoke test - just verify connections work
    assert tracker is not None
