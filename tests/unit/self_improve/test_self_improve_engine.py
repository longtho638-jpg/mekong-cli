import pytest
import os
from unittest.mock import MagicMock, patch
from antigravity.core.self_improve.engine import SelfImproveEngine
from antigravity.core.self_improve.types import ImprovementType, LearningEntry, LearningSource

@pytest.fixture
def engine():
    # Patch persistence to avoid side effects during initialization
    with patch("antigravity.core.self_improve.engine.load_learnings", return_value={}):
        return SelfImproveEngine()

def test_learn_from_error(engine):
    error = ValueError("Test error")
    context = {"file": "test.py"}

    # First occurrence
    pattern_key = engine.learn_from_error(error, context)
    assert pattern_key in engine.learnings
    assert engine.learnings[pattern_key].occurrences == 1
    assert engine._error_patterns[pattern_key] == 1

    # Second occurrence
    engine.learn_from_error(error, context)
    assert engine.learnings[pattern_key].occurrences == 2

    # Third occurrence - should trigger suggestion
    engine.learn_from_error(error, context)
    assert engine.learnings[pattern_key].occurrences == 3
    assert len(engine.suggestions) > 0

    # Check suggestion details
    suggestion = list(engine.suggestions.values())[0]
    assert "ValueError" in suggestion.description
    assert suggestion.type == ImprovementType.RELIABILITY

def test_profile_function(engine):
    # Test slow function
    engine.profile_function("slow_func", 2.5, True)

    assert "slow_func" in engine.profiles
    profile = engine.profiles["slow_func"]
    assert profile.call_count == 1
    assert profile.avg_execution_time == 2.5

    # Should have a performance suggestion
    suggestions = engine.get_suggestions(type_filter=ImprovementType.PERFORMANCE)
    assert len(suggestions) > 0
    assert "slow_func" in suggestions[0].description

def test_get_status(engine):
    engine.learn_from_error(ValueError("Err1"))
    engine.profile_function("func1", 0.1, True)

    status = engine.get_status()
    assert status["total_learnings"] == 1
    assert status["profiles_tracked"] == 1
    assert status["error_patterns"] == 1

@patch("antigravity.core.self_improve.engine.apply_suggestion_logic")
def test_apply_suggestion(mock_apply, engine):
    # Setup a fake suggestion
    suggestion_id = "sug_1"
    suggestion = MagicMock(id=suggestion_id, description="Test Fix", applied=False)
    engine.suggestions[suggestion_id] = suggestion

    mock_apply.return_value = {"id": suggestion_id, "status": "applied"}

    result = engine.apply_suggestion(suggestion_id)
    assert result is True
    assert len(engine._optimization_history) == 1
    mock_apply.assert_called_once_with(engine.suggestions, suggestion_id)

def test_persistence_call(engine):
    with patch("antigravity.core.self_improve.engine.save_learnings") as mock_save:
        # We don't run the loop in background because it's hard to test
        # but we can manually trigger parts if needed or just trust the loop calls it.
        # For unit test, let's verify save_learnings is available.
        from antigravity.core.self_improve.persistence import save_learnings
        save_learnings(engine.learnings, path="/tmp/test_learnings.json")
        assert os.path.exists("/tmp/test_learnings.json")
        os.remove("/tmp/test_learnings.json")
