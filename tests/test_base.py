"""
Tests for Base classes.
"""

import os
import sys
from dataclasses import dataclass
from datetime import datetime

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.base import BaseEngine, BaseModel


@dataclass
class MockModel(BaseModel):
    name: str = ""
    value: int = 0


class MockEngine(BaseEngine):
    def get_stats(self):
        return {"status": "ok"}


class TestBase:
    def test_base_model_serialization(self):
        """Test BaseModel to_dict and from_dict."""
        m = MockModel(name="test", value=100)
        data = m.to_dict()

        assert data["name"] == "test"
        assert data["value"] == 100
        assert isinstance(data["created_at"], str)

        # Load back
        m2 = MockModel.from_dict(data)
        assert m2.name == "test"
        assert m2.value == 100
        assert isinstance(m2.created_at, datetime)

    def test_base_engine_storage(self, tmp_path):
        """Test BaseEngine file operations."""
        engine = MockEngine(data_dir=str(tmp_path))
        data = {"hello": "world"}
        path = engine.save_data("test.json", data)

        assert path.exists()
        loaded = engine.load_data("test.json")
        assert loaded["hello"] == "world"


if __name__ == "__main__":
    pytest.main([__file__])
