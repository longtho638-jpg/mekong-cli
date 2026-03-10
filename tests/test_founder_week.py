"""Tests for src/core/founder_week.py."""

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.founder_week import (
    Priority,
    collect_git_velocity,
    collect_task_stats,
    generate_daily_standup,
    generate_friday_review,
    generate_investor_update,
    generate_monday_brief,
    get_week_number,
    save_brief,
    save_priorities,
    save_review,
    save_standup,
    save_investor_update,
)


class TestDataCollection(unittest.TestCase):
    def test_git_velocity(self):
        # Should not crash even outside git repo
        with TemporaryDirectory() as tmpdir:
            count = collect_git_velocity(tmpdir)
            self.assertIsInstance(count, int)

    def test_task_stats_empty(self):
        with TemporaryDirectory() as tmpdir:
            stats = collect_task_stats(tmpdir)
            self.assertEqual(stats["total"], 0)

    def test_task_stats_with_data(self):
        with TemporaryDirectory() as tmpdir:
            mem_dir = Path(tmpdir) / ".mekong"
            mem_dir.mkdir()
            tasks = [{"status": "done"}, {"status": "done"}, {"status": "failed"}]
            (mem_dir / "memory.json").write_text(json.dumps(tasks))
            stats = collect_task_stats(tmpdir)
            self.assertEqual(stats["total"], 3)
            self.assertEqual(stats["done"], 2)
            self.assertAlmostEqual(stats["success_rate"], 66.7, places=1)

    def test_week_number(self):
        wn = get_week_number()
        self.assertGreater(wn, 0)
        self.assertLessEqual(wn, 53)


class TestMondayBrief(unittest.TestCase):
    def test_generate(self):
        with TemporaryDirectory() as tmpdir:
            brief = generate_monday_brief(tmpdir, "TestCo")
            self.assertEqual(brief.company_name, "TestCo")
            self.assertGreater(brief.week_number, 0)
            self.assertEqual(len(brief.priorities), 3)
            self.assertEqual(len(brief.daily_tasks), 5)

    def test_human_actions(self):
        with TemporaryDirectory() as tmpdir:
            brief = generate_monday_brief(tmpdir)
            self.assertGreater(len(brief.human_actions), 0)

    def test_with_memory_data(self):
        with TemporaryDirectory() as tmpdir:
            mem_dir = Path(tmpdir) / ".mekong"
            mem_dir.mkdir()
            tasks = [{"status": "done"} for _ in range(10)]
            (mem_dir / "memory.json").write_text(json.dumps(tasks))
            brief = generate_monday_brief(tmpdir, "DataCo")
            self.assertEqual(brief.performance.tasks_done, 10)
            self.assertEqual(brief.performance.success_rate, 100.0)


class TestFridayReview(unittest.TestCase):
    def test_generate(self):
        with TemporaryDirectory() as tmpdir:
            priorities = [
                Priority("P1", "Ship feature", "Growth", "DONE"),
                Priority("P2", "Write content", "Marketing", "PARTIAL"),
            ]
            review = generate_friday_review(tmpdir, priorities)
            self.assertGreater(review.week_number, 0)
            self.assertEqual(len(review.priorities_status), 2)
            self.assertIsInstance(review.learning, str)

    def test_what_worked_didnt(self):
        with TemporaryDirectory() as tmpdir:
            review = generate_friday_review(tmpdir, [])
            self.assertGreater(len(review.what_worked) + len(review.what_didnt), 0)


class TestDailyStandup(unittest.TestCase):
    def test_generate(self):
        with TemporaryDirectory() as tmpdir:
            standup = generate_daily_standup(tmpdir)
            self.assertIsNotNone(standup.date)
            self.assertIn("commit", standup.yesterday.lower())
            self.assertIsInstance(standup.blocker, str)


class TestInvestorUpdate(unittest.TestCase):
    def test_generate(self):
        update = generate_investor_update(
            "Acme", 10000, 15.0, 200, 30,
            "Launched v2.0",
            ["Built auth", "Shipped payments", "Hit $10K MRR"],
            "Hiring is hard",
            ["Scale to $20K MRR", "Hire engineer", "Launch mobile"],
        )
        self.assertEqual(update.mrr, 10000)
        self.assertEqual(len(update.accomplishments), 3)
        self.assertIn("Introductions", update.ask)

    def test_custom_ask(self):
        update = generate_investor_update(
            "Co", 0, 0, 0, 0, "win", ["a"], "challenge", ["next"],
            ask="Intro to enterprise buyers",
        )
        self.assertEqual(update.ask, "Intro to enterprise buyers")


class TestSaveFiles(unittest.TestCase):
    def test_save_brief(self):
        with TemporaryDirectory() as tmpdir:
            brief = generate_monday_brief(tmpdir, "Co")
            path = save_brief(tmpdir, brief)
            self.assertTrue(Path(path).exists())
            data = json.loads(Path(path).read_text())
            self.assertEqual(data["company_name"], "Co")

    def test_save_priorities(self):
        with TemporaryDirectory() as tmpdir:
            priorities = [Priority("P1", "Task", "Why")]
            path = save_priorities(tmpdir, 1, priorities)
            self.assertTrue(Path(path).exists())

    def test_save_review(self):
        with TemporaryDirectory() as tmpdir:
            review = generate_friday_review(tmpdir, [])
            path = save_review(tmpdir, review)
            self.assertTrue(Path(path).exists())

    def test_save_standup(self):
        with TemporaryDirectory() as tmpdir:
            standup = generate_daily_standup(tmpdir)
            path = save_standup(tmpdir, standup)
            self.assertTrue(Path(path).exists())

    def test_save_investor_update(self):
        with TemporaryDirectory() as tmpdir:
            update = generate_investor_update(
                "Co", 5000, 10, 100, 10, "win", ["a"], "hard", ["next"],
            )
            path = save_investor_update(tmpdir, update)
            self.assertTrue(Path(path).exists())


if __name__ == "__main__":
    unittest.main()
