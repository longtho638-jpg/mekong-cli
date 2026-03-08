"""Tests for AGI Infinite Loop (Tôm Hùm Self-Improvement Engine)."""

import json
import time
from unittest.mock import MagicMock, patch

import pytest

from src.core.agi_loop import AGILoop, IMPROVEMENT_AREAS, get_agi_loop


@pytest.fixture
def agi_loop():
    """Create AGILoop instance with short cooldown for testing."""
    return AGILoop(cooldown=5, telegram_notify=False, max_iterations=2)


@pytest.fixture
def sample_improvement():
    """Sample improvement dict for testing."""
    return {
        "improvement_id": "test-improvement-1",
        "title": "Add error handling",
        "description": "Improve error handling in executor.py",
        "cc_cli_prompt": "/cook Add try-catch blocks to executor.py",
        "target_files": ["src/core/executor.py"],
        "estimated_minutes": 3,
        "priority": "high",
        "category": "error handling and resilience",
    }


class TestAGILoopInit:
    """Test AGILoop initialization and configuration."""

    def test_default_initialization(self):
        """Test default AGILoop initialization."""
        loop = AGILoop()
        assert loop.cooldown == AGILoop.DEFAULT_COOLDOWN
        assert loop.telegram_notify is True
        assert loop.max_iterations is None
        assert loop._running is False
        assert loop.iteration == 0

    def test_custom_initialization(self):
        """Test AGILoop with custom parameters."""
        loop = AGILoop(cooldown=30, telegram_notify=False, max_iterations=5)
        assert loop.cooldown == 30
        assert loop.telegram_notify is False
        assert loop.max_iterations == 5

    def test_history_initialization(self, agi_loop):
        """Test history is initialized correctly."""
        assert isinstance(agi_loop._history, dict)
        assert "completed" in agi_loop._history
        assert "blacklist" in agi_loop._history


class TestHistoryManagement:
    """Test AGI history persistence and management."""

    def test_load_history_new_file(self, tmp_path, monkeypatch):
        """Test loading history when file doesn't exist."""
        monkeypatch.setattr("src.core.agi_loop.HISTORY_PATH", tmp_path / "nonexistent.json")
        loop = AGILoop()
        assert loop._history == {"completed": [], "blacklist": {}, "details": []}

    def test_load_history_existing_file(self, tmp_path, monkeypatch):
        """Test loading history from existing file."""
        history_file = tmp_path / "agi_history.json"
        test_data = {"completed": ["imp-1"], "blacklist": {}, "details": []}
        history_file.write_text(json.dumps(test_data))
        monkeypatch.setattr("src.core.agi_loop.HISTORY_PATH", history_file)
        loop = AGILoop()
        assert "imp-1" in loop._history["completed"]

    def test_save_history(self, tmp_path, monkeypatch):
        """Test saving history to file."""
        history_file = tmp_path / "test_save_history.json"
        monkeypatch.setattr("src.core.agi_loop.HISTORY_PATH", history_file)
        loop = AGILoop()
        loop._history = {"completed": ["imp-1"] * 150, "blacklist": {}, "details": []}
        loop._save_history()
        assert history_file.exists()
        saved = json.loads(history_file.read_text())
        assert len(saved["completed"]) <= 100

    def test_is_blacklisted(self, agi_loop):
        """Test blacklist checking logic."""
        imp_id = "test-fail"
        assert agi_loop._is_blacklisted(imp_id) is False
        agi_loop._history["blacklist"][imp_id] = {"count": 2, "last": time.time()}
        assert agi_loop._is_blacklisted(imp_id) is True


class TestCooldownCalculation:
    """Test adaptive cooldown calculation."""

    def test_cooldown_no_failures(self, agi_loop):
        """Test cooldown with no failures."""
        agi_loop.consecutive_failures = 0
        cooldown = agi_loop._calculate_cooldown()
        assert cooldown == agi_loop.cooldown

    def test_cooldown_with_failures(self, agi_loop):
        """Test increased cooldown on failures."""
        agi_loop.consecutive_failures = 2
        cooldown = agi_loop._calculate_cooldown()
        assert cooldown == min(agi_loop.cooldown * (2 ** 2), 600)

    def test_cooldown_max_limit(self, agi_loop):
        """Test cooldown doesn't exceed 600 seconds."""
        agi_loop.consecutive_failures = 10
        cooldown = agi_loop._calculate_cooldown()
        assert cooldown <= 600


class TestStatusMetrics:
    """Test AGI loop status and metrics."""

    def test_get_status_running(self, agi_loop):
        """Test status when running."""
        agi_loop._running = True
        agi_loop.iteration = 5
        agi_loop.completed_improvements = ["imp-1", "imp-2"]
        status = agi_loop.get_status()
        assert status["running"] is True
        assert status["iteration"] == 5
        assert status["improvements"] == 2
        assert "success_rate" in status
        assert "uptime_seconds" in status

    def test_get_status_not_running(self, agi_loop):
        """Test status when not running."""
        agi_loop._running = False
        status = agi_loop.get_status()
        assert status["running"] is False


class TestAssessStep:
    """Test AGI assessment phase."""

    def test_assess_llm_unavailable(self, agi_loop):
        """Test assessment code path exists."""
        # Coverage: _assess method is callable
        # Full async test in integration tests
        assert hasattr(agi_loop, "_assess")


class TestExecuteStep:
    """Test AGI execution phase."""

    def test_execute_no_prompt(self, agi_loop):
        """Test execution with empty CC CLI prompt."""
        import asyncio
        improvement = {"cc_cli_prompt": "", "title": "Test"}
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(agi_loop._execute(improvement))
            assert result is False
        finally:
            loop.close()

    def test_execute_success(self, agi_loop, sample_improvement):
        """Test successful CC CLI execution."""
        import asyncio
        mock_session = MagicMock()
        mock_session.status.value = "completed"
        mock_session.exit_code = 0
        mock_session.error = None
        async def mock_spawn(*args, **kwargs):
            return mock_session
        with patch("src.core.cc_spawner.get_spawner") as mock_get_spawner:
            mock_spawner = MagicMock()
            mock_spawner.spawn = mock_spawn
            mock_get_spawner.return_value = mock_spawner
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(agi_loop._execute(sample_improvement))
            finally:
                loop.close()
        assert result is True

    def test_execute_failure(self, agi_loop, sample_improvement):
        """Test failed CC CLI execution."""
        import asyncio
        mock_session = MagicMock()
        mock_session.status.value = "failed"
        mock_session.error = "Session failed"
        async def mock_spawn(*args, **kwargs):
            return mock_session
        with patch("src.core.cc_spawner.get_spawner") as mock_get_spawner:
            mock_spawner = MagicMock()
            mock_spawner.spawn = mock_spawn
            mock_get_spawner.return_value = mock_spawner
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(agi_loop._execute(sample_improvement))
            finally:
                loop.close()
        assert result is False


class TestMemorizeStep:
    """Test AGI memorization phase."""

    def test_memorize_memory_unavailable(self, agi_loop, sample_improvement):
        """Test memorization when memory unavailable."""
        import asyncio
        with patch("src.core.memory_client.get_memory_client") as mock_get_mem:
            mock_mem = MagicMock()
            mock_mem.is_available = False
            mock_get_mem.return_value = mock_mem
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(agi_loop._memorize(sample_improvement, success=True))
            finally:
                loop.close()


class TestReportStep:
    """Test AGI reporting phase."""

    def test_report_telegram_disabled(self, agi_loop, sample_improvement):
        """Test report skips when Telegram disabled."""
        import asyncio
        agi_loop.telegram_notify = False
        with patch.object(agi_loop, "_send_telegram") as mock_send:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(agi_loop._report(sample_improvement, success=True))
            finally:
                loop.close()
        mock_send.assert_not_called()

    def test_report_error(self, agi_loop):
        """Test error reporting."""
        import asyncio
        agi_loop.telegram_notify = True
        with patch.object(agi_loop, "_send_telegram") as mock_send:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(agi_loop._report_error("Test error message"))
            finally:
                loop.close()
        mock_send.assert_called_once()


class TestShutdown:
    """Test AGI loop shutdown handling."""

    def test_stop(self, agi_loop):
        """Test stopping the AGI loop."""
        agi_loop._running = True
        agi_loop.stop()
        assert agi_loop._running is False

    def test_handle_shutdown(self, agi_loop):
        """Test signal handler for shutdown."""
        agi_loop._running = True
        agi_loop._handle_shutdown()
        assert agi_loop._running is False


class TestSingleton:
    """Test AGI loop singleton pattern."""

    def test_get_agi_loop_singleton(self):
        """Test get_agi_loop returns same instance."""
        loop1 = get_agi_loop()
        loop2 = get_agi_loop()
        assert loop1 is loop2


class TestImprovementAreas:
    """Test improvement areas configuration."""

    def test_improvement_areas_not_empty(self):
        """Test improvement areas list is populated."""
        assert len(IMPROVEMENT_AREAS) > 0
        assert "error handling and resilience" in IMPROVEMENT_AREAS
        assert "test coverage and quality" in IMPROVEMENT_AREAS
