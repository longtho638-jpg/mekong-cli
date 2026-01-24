import pytest
import json
import os
import tempfile
from antigravity.core.self_improve.persistence import load_learnings, save_learnings
from antigravity.core.self_improve.types import LearningEntry, LearningSource

@pytest.fixture
def temp_learnings_file():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
        path = f.name
    yield path
    if os.path.exists(path):
        os.remove(path)

def test_save_and_load_learnings(temp_learnings_file):
    learnings = {
        "pattern1": LearningEntry(
            id="pattern1",
            source=LearningSource.ERROR_LOGS,
            pattern="KeyError: 'foo'",
            solution="Add check",
            confidence=0.8,
            occurrences=5
        )
    }

    # Test Save
    success = save_learnings(learnings, path=temp_learnings_file)
    assert success is True
    assert os.path.exists(temp_learnings_file)

    # Verify file content
    with open(temp_learnings_file, "r") as f:
        data = json.load(f)
        assert len(data) == 1
        assert data[0]["id"] == "pattern1"
        assert data[0]["source"] == "error_logs"

    # Test Load
    loaded = load_learnings(path=temp_learnings_file)
    assert len(loaded) == 1
    assert "pattern1" in loaded
    assert loaded["pattern1"].id == "pattern1"
    assert loaded["pattern1"].source == LearningSource.ERROR_LOGS
    assert loaded["pattern1"].occurrences == 5

def test_load_non_existent_file():
    loaded = load_learnings(path="/tmp/non_existent_file_12345.json")
    assert loaded == {}

def test_load_invalid_json(temp_learnings_file):
    with open(temp_learnings_file, "w") as f:
        f.write("invalid json")

    loaded = load_learnings(path=temp_learnings_file)
    assert loaded == {}

def test_save_error_handling():
    # Attempt to save to a read-only or invalid path
    # On some systems /proc/noperm might work, but let's use a path that's a directory
    with tempfile.TemporaryDirectory() as temp_dir:
        success = save_learnings({}, path=temp_dir)
        assert success is False
