"""Tests for Mekong Code Evolution Engine (AGI v2)."""

import os
import tempfile
import unittest

from src.core.code_evolution import (
    CodeChange,
    CodeEvolutionEngine,
    EvolutionAttempt,
    EvolutionStatus,
)


class TestEvolutionAttempt(unittest.TestCase):
    def test_default_values(self):
        a = EvolutionAttempt()
        self.assertEqual(a.status, EvolutionStatus.PROPOSED)
        self.assertEqual(a.changes, [])
        self.assertEqual(a.rollback_data, {})

    def test_fields_settable(self):
        a = EvolutionAttempt(
            id="evo-123",
            description="Fix bug",
            status=EvolutionStatus.APPLIED,
        )
        self.assertEqual(a.id, "evo-123")
        self.assertEqual(a.status, EvolutionStatus.APPLIED)


class TestCodeChange(unittest.TestCase):
    def test_default(self):
        c = CodeChange(file_path="src/core/test.py")
        self.assertEqual(c.change_type, "modify")
        self.assertEqual(c.original_content, "")


class TestEvolutionStatus(unittest.TestCase):
    def test_all_statuses(self):
        self.assertEqual(len(EvolutionStatus), 6)
        self.assertEqual(EvolutionStatus.PROPOSED.value, "proposed")
        self.assertEqual(EvolutionStatus.APPLIED.value, "applied")
        self.assertEqual(EvolutionStatus.ROLLED_BACK.value, "rolled_back")


class TestCodeEvolutionEngine(unittest.TestCase):
    def _make_engine(self, tmpdir):
        # Create a minimal project structure
        src_dir = os.path.join(tmpdir, "src", "core")
        os.makedirs(src_dir)
        with open(os.path.join(src_dir, "sample.py"), "w") as f:
            f.write("def hello():\n    return 'world'\n")
        journal = os.path.join(tmpdir, ".mekong", "journal.yaml")
        return CodeEvolutionEngine(
            project_root=tmpdir,
            journal_path=journal,
        )

    def test_analyze_source(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            report = engine.analyze_source("src/core")
            self.assertIn("files", report)
            self.assertGreater(len(report["files"]), 0)
            self.assertGreater(report["total_lines"], 0)

    def test_analyze_nonexistent_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            report = engine.analyze_source("nonexistent")
            self.assertIn("error", report)

    def test_safety_check_forbidden(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            self.assertFalse(engine._is_safe_to_modify("src/core/governance.py"))
            self.assertFalse(engine._is_safe_to_modify("src/core/code_evolution.py"))

    def test_safety_check_allowed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            self.assertTrue(engine._is_safe_to_modify("src/core/nlu.py"))
            self.assertTrue(engine._is_safe_to_modify("src/agents/git_agent.py"))

    def test_safety_check_outside_safe_dirs(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            self.assertFalse(engine._is_safe_to_modify("config/settings.py"))
            self.assertFalse(engine._is_safe_to_modify("main.py"))

    def test_propose_without_llm_returns_none(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            result = engine.propose_evolution(
                "src/core/sample.py", "Add logging",
            )
            self.assertIsNone(result)

    def test_get_journal_empty(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            journal = engine.get_journal()
            self.assertEqual(len(journal), 0)

    def test_get_stats_empty(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            stats = engine.get_stats()
            self.assertEqual(stats["total_attempts"], 0)
            self.assertAlmostEqual(stats["success_rate"], 0.0)

    def test_rollback_nonexistent(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            self.assertFalse(engine.rollback("evo-nonexistent"))

    def test_apply_not_passed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            engine = self._make_engine(tmpdir)
            attempt = EvolutionAttempt(
                id="evo-test",
                status=EvolutionStatus.PROPOSED,
            )
            self.assertFalse(engine.apply_evolution(attempt))


if __name__ == "__main__":
    unittest.main()
