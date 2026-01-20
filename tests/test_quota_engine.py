"""
Tests for Antigravity Quota Engine.
Validates quota monitoring, threshold detection, and status formatting.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from packages.antigravity.core.quota import (
    QuotaEngine,
    QuotaModel,
    QuotaPool,
    StatusFormat,
    ThresholdLevel,
)


class TestQuotaModel:
    """Tests for QuotaModel dataclass."""

    def test_threshold_level_normal(self):
        """Verify normal threshold for > 30%."""
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=50.0,
        )
        assert model.threshold_level == ThresholdLevel.NORMAL

    def test_threshold_level_warning(self):
        """Verify warning threshold for 10-30%."""
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=25.0,
        )
        assert model.threshold_level == ThresholdLevel.WARNING

    def test_threshold_level_critical(self):
        """Verify critical threshold for < 10%."""
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=5.0,
        )
        assert model.threshold_level == ThresholdLevel.CRITICAL

    def test_countdown_format_hours(self):
        """Verify countdown format with hours."""
        # Use UTC to match implementation logic
        now = datetime.now(timezone.utc)
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=50.0,
            reset_time=now + timedelta(hours=4, minutes=30),
        )
        # Check format is "Xh Ym" - minutes may vary slightly due to timing
        assert "4h" in model.countdown
        assert "m" in model.countdown

    def test_countdown_format_minutes_only(self):
        """Verify countdown format with only minutes."""
        now = datetime.now(timezone.utc)
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=50.0,
            reset_time=now + timedelta(minutes=45),
        )
        # Should be around 44-45m, no hours
        assert "m" in model.countdown
        assert "h" not in model.countdown

    def test_countdown_ready(self):
        """Verify countdown shows Ready for past reset time."""
        now = datetime.now(timezone.utc)
        model = QuotaModel(
            model_id="test",
            model_name="Test Model",
            remaining_percent=50.0,
            reset_time=now - timedelta(minutes=5),
        )
        assert model.countdown == "Ready"

    def test_status_format_rocket(self):
        """Verify rocket format."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.ROCKET) == "🚀"

    def test_status_format_dot(self):
        """Verify dot format with correct color."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.DOT) == "🟢"

    def test_status_format_dot_percent(self):
        """Verify dot + percent format."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.DOT_PERCENT) == "🟢 95%"

    def test_status_format_percent(self):
        """Verify percent only format."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.PERCENT) == "95%"

    def test_status_format_name_percent(self):
        """Verify name + percent format."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.NAME_PERCENT) == "Sonnet: 95%"

    def test_status_format_full(self):
        """Verify full format."""
        model = QuotaModel(
            model_id="test",
            model_name="Sonnet",
            remaining_percent=95.0,
        )
        assert model.format_status(StatusFormat.FULL) == "🟢 Sonnet: 95%"

    def test_status_emoji_warning(self):
        """Verify yellow emoji for warning level."""
        model = QuotaModel(
            model_id="test",
            model_name="Test",
            remaining_percent=20.0,
        )
        assert "🟡" in model.format_status(StatusFormat.DOT)

    def test_status_emoji_critical(self):
        """Verify red emoji for critical level."""
        model = QuotaModel(
            model_id="test",
            model_name="Test",
            remaining_percent=5.0,
        )
        assert "🔴" in model.format_status(StatusFormat.DOT)


class TestQuotaPool:
    """Tests for QuotaPool grouping."""

    def test_aggregate_remaining(self):
        """Verify aggregate takes minimum remaining."""
        pool = QuotaPool(
            pool_id="test-pool",
            pool_name="Test Pool",
            models=[
                QuotaModel("m1", "Model 1", 80.0),
                QuotaModel("m2", "Model 2", 45.0),
                QuotaModel("m3", "Model 3", 92.0),
            ],
        )
        assert pool.aggregate_remaining == 45.0

    def test_lowest_model(self):
        """Verify lowest model detection."""
        pool = QuotaPool(
            pool_id="test-pool",
            pool_name="Test Pool",
            models=[
                QuotaModel("m1", "Model 1", 80.0),
                QuotaModel("m2", "Model 2", 45.0),
                QuotaModel("m3", "Model 3", 92.0),
            ],
        )
        assert pool.lowest_model.model_name == "Model 2"

    def test_empty_pool(self):
        """Verify empty pool handling."""
        pool = QuotaPool(pool_id="empty", pool_name="Empty")
        assert pool.aggregate_remaining == 0.0
        assert pool.lowest_model is None


class TestQuotaEngine:
    """Tests for QuotaEngine main class."""

    def test_initialization(self):
        """Verify engine initialization."""
        engine = QuotaEngine()
        assert engine.warning_threshold == 30
        assert engine.critical_threshold == 10

    def test_custom_thresholds(self):
        """Verify custom threshold configuration."""
        engine = QuotaEngine(warning_threshold=40, critical_threshold=15)
        assert engine.warning_threshold == 40
        assert engine.critical_threshold == 15

    def test_get_local_quota_returns_mock(self):
        """Verify local quota returns mock data when no process."""
        engine = QuotaEngine()
        models = engine.get_local_quota()
        assert len(models) > 0
        assert all(isinstance(m, QuotaModel) for m in models)

    def test_get_current_status_structure(self):
        """Verify status response structure."""
        engine = QuotaEngine()
        status = engine.get_current_status()

        assert "models" in status
        assert "pools" in status
        assert "alerts" in status
        assert "status_bar" in status
        assert "last_fetch" in status

    def test_alerts_detection(self):
        """Verify alerts are correctly populated."""
        engine = QuotaEngine()
        status = engine.get_current_status()

        # Mock data includes a critical model (8%)
        assert "alerts" in status
        assert "criticals" in status["alerts"]
        assert "warnings" in status["alerts"]

    def test_format_cli_output_full(self):
        """Verify full CLI output format."""
        engine = QuotaEngine()
        output = engine.format_cli_output("full")

        assert "Antigravity Quota Monitor" in output
        assert "%" in output
        assert "█" in output  # Progress bar

    def test_format_cli_output_compact(self):
        """Verify compact CLI output format."""
        engine = QuotaEngine()
        output = engine.format_cli_output("compact")

        assert "Antigravity Quota Monitor" in output
        assert "█" not in output  # No progress bar in compact

    def test_format_cli_output_json(self):
        """Verify JSON CLI output format."""
        import json

        engine = QuotaEngine()
        output = engine.format_cli_output("json")

        # Should be valid JSON
        data = json.loads(output)
        assert "models" in data


class TestIntegration:
    """Integration tests for full workflow."""

    def test_full_quota_check_workflow(self):
        """Test complete quota check workflow."""
        engine = QuotaEngine()

        # 1. Fetch quota
        models = engine.get_local_quota()
        assert len(models) > 0

        # 2. Get status
        status = engine.get_current_status()
        assert status["models"]

        # 3. Format output
        output = engine.format_cli_output()
        assert len(output) > 0

        # 4. Check for critical alerts
        for model in models:
            if model.remaining_percent < 10:
                assert model.model_name in status["alerts"]["criticals"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
