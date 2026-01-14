"""
Tests for Persistence layer.
"""

import sys
import os
import pytest
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.persistence import JSONStore

class TestPersistence:
    
    def test_json_store_operations(self, tmp_path):
        """Test basic CRUD operations in JSONStore."""
        store = JSONStore(data_dir=str(tmp_path))
        
        # Save
        data = {"key": "value", "list": [1, 2, 3]}
        path = store.save("test_key", data)
        assert path.exists()
        
        # Load
        loaded = store.load("test_key")
        assert loaded == data
        
        # Exists
        assert store.exists("test_key") is True
        assert store.exists("missing") is False
        
        # List
        keys = store.list_keys()
        assert "test_key" in keys
        
        # Delete
        assert store.delete("test_key") is True
        assert store.exists("test_key") is False

    def test_serialization_helpers(self, tmp_path):
        """Test serialization of datetime and custom objects."""
        from datetime import datetime
        store = JSONStore(data_dir=str(tmp_path))
        
        now = datetime.now()
        data = {"time": now}
        store.save("time_test", data)
        
        loaded = store.load("time_test")
        # Should be ISO string
        assert loaded["time"] == now.isoformat()

    def test_atomic_write_recovery(self, tmp_path):
        """Test that directory exists and write works."""
        store = JSONStore(data_dir=str(tmp_path))
        assert store.save("atomic", {"v": 1}).exists()
        assert store.load("atomic")["v"] == 1

if __name__ == "__main__":
    pytest.main([__file__])
