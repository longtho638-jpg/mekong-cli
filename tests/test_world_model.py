"""Tests for Mekong World Model (AGI v2)."""

import os
import tempfile
import unittest

from src.core.world_model import (
    SideEffectPrediction,
    WorldDiff,
    WorldModel,
    WorldState,
)


class TestWorldState(unittest.TestCase):
    """Tests for WorldState dataclass."""

    def test_default_values(self):
        s = WorldState()
        self.assertEqual(s.working_directory, "")
        self.assertEqual(s.file_tree, [])
        self.assertEqual(s.git_branch, "")
        self.assertEqual(s.open_ports, [])
        self.assertGreater(s.timestamp, 0)

    def test_fields_settable(self):
        s = WorldState(
            working_directory="/tmp",
            git_branch="main",
            file_count=42,
            open_ports=[8000, 3000],
        )
        self.assertEqual(s.working_directory, "/tmp")
        self.assertEqual(s.git_branch, "main")
        self.assertEqual(s.file_count, 42)
        self.assertEqual(s.open_ports, [8000, 3000])


class TestWorldDiff(unittest.TestCase):
    """Tests for WorldDiff dataclass."""

    def test_has_changes_false(self):
        d = WorldDiff()
        self.assertFalse(d.has_changes)

    def test_has_changes_true(self):
        d = WorldDiff(files_added=["new.py"])
        self.assertTrue(d.has_changes)

    def test_summary_no_changes(self):
        d = WorldDiff()
        self.assertIn("No changes", d.summary())

    def test_summary_with_changes(self):
        d = WorldDiff(
            files_added=["a.py", "b.py"],
            files_removed=["c.py"],
            git_changed=True,
        )
        summary = d.summary()
        self.assertIn("+2 files added", summary)
        self.assertIn("-1 files removed", summary)
        self.assertIn("git state changed", summary)


class TestSideEffectPrediction(unittest.TestCase):
    """Tests for SideEffectPrediction dataclass."""

    def test_default_values(self):
        p = SideEffectPrediction(action="test")
        self.assertEqual(p.action, "test")
        self.assertEqual(p.risk_level, "low")
        self.assertEqual(p.warnings, [])


class TestWorldModel(unittest.TestCase):
    """Tests for WorldModel."""

    def test_snapshot(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create some test files
            open(os.path.join(tmpdir, "test.py"), "w").close()
            open(os.path.join(tmpdir, "readme.md"), "w").close()

            model = WorldModel(working_dir=tmpdir)
            state = model.snapshot()

            self.assertEqual(state.working_directory, tmpdir)
            self.assertGreaterEqual(state.file_count, 2)
            self.assertGreater(state.timestamp, 0)

    def test_diff_no_changes(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            model = WorldModel(working_dir=tmpdir)
            s1 = model.snapshot()
            s2 = model.snapshot()

            diff = model.diff(s1, s2)
            self.assertEqual(diff.files_added, [])
            self.assertEqual(diff.files_removed, [])

    def test_diff_with_added_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            model = WorldModel(working_dir=tmpdir)
            s1 = model.snapshot()

            # Add a file
            open(os.path.join(tmpdir, "new_file.txt"), "w").close()
            s2 = model.snapshot()

            diff = model.diff(s1, s2)
            self.assertIn("new_file.txt", diff.files_added)

    def test_diff_with_removed_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = os.path.join(tmpdir, "temp.txt")
            open(filepath, "w").close()

            model = WorldModel(working_dir=tmpdir)
            s1 = model.snapshot()

            os.remove(filepath)
            s2 = model.snapshot()

            diff = model.diff(s1, s2)
            self.assertIn("temp.txt", diff.files_removed)

    def test_predict_destructive_operation(self):
        model = WorldModel()
        pred = model.predict_side_effects("rm -rf build/")
        self.assertEqual(pred.risk_level, "high")
        self.assertTrue(any("delete" in w.lower() for w in pred.warnings))

    def test_predict_deployment(self):
        model = WorldModel()
        pred = model.predict_side_effects("deploy to production")
        self.assertEqual(pred.risk_level, "high")

    def test_predict_package_install(self):
        model = WorldModel()
        pred = model.predict_side_effects("pip install requests")
        self.assertEqual(pred.risk_level, "medium")

    def test_predict_safe_operation(self):
        model = WorldModel()
        pred = model.predict_side_effects("list all files")
        self.assertEqual(pred.risk_level, "low")

    def test_get_latest_snapshot(self):
        model = WorldModel()
        self.assertIsNone(model.get_latest_snapshot())
        model.snapshot()
        self.assertIsNotNone(model.get_latest_snapshot())

    def test_get_context_summary(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            model = WorldModel(working_dir=tmpdir)
            summary = model.get_context_summary()
            self.assertIn("Working dir", summary)
            self.assertIn("Files", summary)

    def test_max_snapshots(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            model = WorldModel(working_dir=tmpdir)
            for _ in range(25):
                model.snapshot()
            self.assertLessEqual(len(model._snapshots), 20)


if __name__ == "__main__":
    unittest.main()
