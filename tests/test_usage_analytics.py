"""Tests for RaaS UsageAnalytics — per-tenant usage aggregation.

Covers: get_tenant_summary (daily breakdown, complexity breakdown, totals),
get_recent_activity, and edge cases (empty DB, missing tables).
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from src.raas.usage_analytics import DailyUsage, TenantUsageSummary, UsageAnalytics


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    """Isolated SQLite DB per test."""
    return tmp_path / "test_analytics.db"


@pytest.fixture()
def analytics(db_path: Path) -> UsageAnalytics:
    """UsageAnalytics with isolated temp DB."""
    return UsageAnalytics(db_path=db_path)


@pytest.fixture()
def seeded_db(db_path: Path) -> Path:
    """DB pre-seeded with missions table and sample data."""
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE missions (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            goal TEXT,
            status TEXT NOT NULL,
            complexity TEXT,
            credits_cost INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
        """
    )
    # Insert sample missions for tenant-a
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    missions = [
        ("m1", "tenant-a", "build app", "completed", "standard", 3, now, now),
        ("m2", "tenant-a", "fix bug", "completed", "simple", 1, now, now),
        ("m3", "tenant-a", "deploy", "failed", "complex", 5, now, None),
        ("m4", "tenant-b", "other task", "completed", "simple", 1, now, now),
    ]
    conn.executemany(
        "INSERT INTO missions VALUES (?, ?, ?, ?, ?, ?, ?, ?)", missions
    )
    conn.commit()
    conn.close()
    return db_path


# ---------------------------------------------------------------------------
# Tests: get_tenant_summary
# ---------------------------------------------------------------------------


def test_tenant_summary_with_data(seeded_db: Path) -> None:
    """Summary aggregates daily breakdown, complexity, and totals."""
    ua = UsageAnalytics(db_path=seeded_db)
    summary = ua.get_tenant_summary("tenant-a", days=30)

    assert isinstance(summary, TenantUsageSummary)
    assert summary.tenant_id == "tenant-a"
    assert summary.total_missions == 3
    assert summary.missions_completed == 2
    assert summary.missions_failed == 1
    assert summary.total_credits_used == 9  # 3+1+5
    assert len(summary.daily_breakdown) >= 1
    assert isinstance(summary.daily_breakdown[0], DailyUsage)
    assert "standard" in summary.complexity_breakdown
    assert "simple" in summary.complexity_breakdown
    assert "complex" in summary.complexity_breakdown


def test_tenant_summary_tenant_isolation(seeded_db: Path) -> None:
    """Summary only includes data for the requested tenant."""
    ua = UsageAnalytics(db_path=seeded_db)
    summary_b = ua.get_tenant_summary("tenant-b", days=30)

    assert summary_b.total_missions == 1
    assert summary_b.missions_completed == 1
    assert summary_b.missions_failed == 0


def test_tenant_summary_empty_tenant(seeded_db: Path) -> None:
    """Summary returns zeros for a tenant with no missions."""
    ua = UsageAnalytics(db_path=seeded_db)
    summary = ua.get_tenant_summary("tenant-nonexistent", days=30)

    assert summary.total_credits_used == 0
    assert summary.total_missions == 0
    assert summary.daily_breakdown == []
    assert summary.complexity_breakdown == {}


def test_tenant_summary_missing_table(db_path: Path) -> None:
    """Summary handles missing missions table gracefully."""
    # Create empty DB (no tables)
    conn = sqlite3.connect(str(db_path))
    conn.close()
    ua = UsageAnalytics(db_path=db_path)

    summary = ua.get_tenant_summary("any-tenant", days=30)
    assert summary.total_credits_used == 0
    assert summary.total_missions == 0


# ---------------------------------------------------------------------------
# Tests: get_recent_activity
# ---------------------------------------------------------------------------


def test_recent_activity_returns_missions(seeded_db: Path) -> None:
    """get_recent_activity returns mission dicts ordered by created_at."""
    ua = UsageAnalytics(db_path=seeded_db)
    activity = ua.get_recent_activity("tenant-a", limit=10)

    assert len(activity) == 3
    assert all(isinstance(a, dict) for a in activity)
    assert all("id" in a for a in activity)
    assert all("goal" in a for a in activity)


def test_recent_activity_respects_limit(seeded_db: Path) -> None:
    """get_recent_activity honours the limit parameter."""
    ua = UsageAnalytics(db_path=seeded_db)
    activity = ua.get_recent_activity("tenant-a", limit=2)
    assert len(activity) == 2


def test_recent_activity_empty(seeded_db: Path) -> None:
    """get_recent_activity returns empty list for unknown tenant."""
    ua = UsageAnalytics(db_path=seeded_db)
    activity = ua.get_recent_activity("tenant-ghost", limit=10)
    assert activity == []


def test_recent_activity_missing_table(db_path: Path) -> None:
    """get_recent_activity handles missing table gracefully."""
    conn = sqlite3.connect(str(db_path))
    conn.close()
    ua = UsageAnalytics(db_path=db_path)
    activity = ua.get_recent_activity("any", limit=5)
    assert activity == []


# ---------------------------------------------------------------------------
# Tests: DailyUsage dataclass
# ---------------------------------------------------------------------------


def test_daily_usage_dataclass() -> None:
    """DailyUsage stores all expected fields."""
    du = DailyUsage(
        date="2026-03-13",
        credits_used=10,
        missions_count=5,
        missions_completed=4,
        missions_failed=1,
    )
    assert du.date == "2026-03-13"
    assert du.credits_used == 10
    assert du.missions_count == 5


def test_tenant_usage_summary_defaults() -> None:
    """TenantUsageSummary defaults for optional fields."""
    s = TenantUsageSummary(
        tenant_id="t1",
        period_start="2026-03-01",
        period_end="2026-03-13",
        total_credits_used=0,
        total_missions=0,
        missions_completed=0,
        missions_failed=0,
    )
    assert s.daily_breakdown == []
    assert s.complexity_breakdown == {}


# ---------------------------------------------------------------------------
# Tests: Connection and internals
# ---------------------------------------------------------------------------


def test_connect_returns_row_factory(seeded_db: Path) -> None:
    """_connect returns connection with Row factory."""
    ua = UsageAnalytics(db_path=seeded_db)
    conn = ua._connect()
    row = conn.execute("SELECT 1 as val").fetchone()
    assert row["val"] == 1
    conn.close()
