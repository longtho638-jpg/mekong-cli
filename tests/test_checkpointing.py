"""
Tests for Checkpointing system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.checkpoint import Checkpoint


class TestCheckpointing:
    def test_save_and_list(self, tmp_path):
        """Test saving and listing checkpoints."""
        cp_sys = Checkpoint(storage_path=str(tmp_path))

        # Save
        state = cp_sys.save("test_cp", "Initial state")
        assert state.name == "test_cp"

        # List
        all_cp = cp_sys.list()
        assert len(all_cp) == 1
        assert all_cp[0].name == "test_cp"

    def test_restore(self, tmp_path):
        """Test restoring checkpoint."""
        cp_sys = Checkpoint(storage_path=str(tmp_path))
        cp_sys.save("v1")

        assert cp_sys.restore("v1") is True
        assert cp_sys.restore("v2") is False

    def test_delete(self, tmp_path):
        """Test deleting checkpoint."""
        cp_sys = Checkpoint(storage_path=str(tmp_path))
        cp_sys.save("temp")

        assert len(cp_sys.list()) == 1
        assert cp_sys.delete("temp") is True
        assert len(cp_sys.list()) == 0

    def test_persistence(self, tmp_path):
        """Test that index is persisted across instances."""
        storage = str(tmp_path)
        cp1 = Checkpoint(storage_path=storage)
        cp1.save("p1")

        cp2 = Checkpoint(storage_path=storage)
        assert len(cp2.list()) == 1
        assert cp2.list()[0].name == "p1"


if __name__ == "__main__":
    pytest.main([__file__])
