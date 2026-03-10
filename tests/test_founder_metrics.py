"""Tests for src/core/founder_metrics.py."""

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.founder_metrics import (
    NorthStarMetric,
    build_alert_rules,
    build_kpi_hierarchy,
    check_alerts,
    check_metrics,
    save_metrics_config,
    save_snapshot,
    select_north_star,
    setup_metrics,
)


class TestNorthStar(unittest.TestCase):
    def test_saas(self):
        ns = select_north_star("saas", 10000)
        self.assertIn("MRR", ns.name)
        self.assertEqual(ns.target, 10000)

    def test_devtool(self):
        ns = select_north_star("devtool")
        self.assertIn("Developer", ns.name)

    def test_unknown_defaults_saas(self):
        ns = select_north_star("unknown_type")
        self.assertIn("MRR", ns.name)

    def test_pct_to_target(self):
        ns = NorthStarMetric("test", "desc", 100, 50)
        self.assertEqual(ns.pct_to_target, 50.0)

    def test_pct_zero_target(self):
        ns = NorthStarMetric("test", "desc", 0, 50)
        self.assertEqual(ns.pct_to_target, 0.0)


class TestKPIHierarchy(unittest.TestCase):
    def test_saas_has_ops_metrics(self):
        kpis = build_kpi_hierarchy("saas")
        ops = [k for k in kpis if k.category == "operations"]
        self.assertGreater(len(ops), 0)

    def test_marketplace_no_ops(self):
        kpis = build_kpi_hierarchy("marketplace")
        ops = [k for k in kpis if k.category == "operations"]
        self.assertEqual(len(ops), 0)

    def test_has_leading_indicators(self):
        kpis = build_kpi_hierarchy("saas")
        tier4 = [k for k in kpis if k.tier == 4]
        self.assertGreater(len(tier4), 0)

    def test_tier2_growth(self):
        kpis = build_kpi_hierarchy("saas")
        tier2 = [k for k in kpis if k.tier == 2]
        self.assertGreater(len(tier2), 5)


class TestAlertRules(unittest.TestCase):
    def test_has_critical(self):
        alerts = build_alert_rules()
        critical = [a for a in alerts if a.severity == "critical"]
        self.assertGreater(len(critical), 0)

    def test_has_celebration(self):
        alerts = build_alert_rules()
        celebrations = [a for a in alerts if a.severity == "celebration"]
        self.assertGreater(len(celebrations), 0)

    def test_total_count(self):
        alerts = build_alert_rules()
        self.assertGreaterEqual(len(alerts), 8)


class TestSetupMetrics(unittest.TestCase):
    def test_full_setup(self):
        config = setup_metrics("saas", 5000)
        self.assertIn("MRR", config.north_star.name)
        self.assertGreater(len(config.kpis), 10)
        self.assertGreater(len(config.alerts), 5)

    def test_product_type_stored(self):
        config = setup_metrics("devtool")
        self.assertEqual(config.product_type, "devtool")


class TestCheckMetrics(unittest.TestCase):
    def test_empty_dir(self):
        with TemporaryDirectory() as tmpdir:
            snapshot = check_metrics(tmpdir)
            self.assertIsNotNone(snapshot.timestamp)

    def test_with_memory(self):
        with TemporaryDirectory() as tmpdir:
            mem_dir = Path(tmpdir) / ".mekong"
            mem_dir.mkdir()
            mem_file = mem_dir / "memory.json"
            tasks = [{"status": "done"}, {"status": "done"}, {"status": "failed"}]
            mem_file.write_text(json.dumps(tasks))

            snapshot = check_metrics(tmpdir)
            self.assertEqual(snapshot.metrics["tasks_total"], 3)
            self.assertEqual(snapshot.metrics["tasks_completed"], 2)

    def test_low_success_triggers_alert(self):
        with TemporaryDirectory() as tmpdir:
            mem_dir = Path(tmpdir) / ".mekong"
            mem_dir.mkdir()
            tasks = [{"status": "done"}] + [{"status": "failed"} for _ in range(5)]
            (mem_dir / "memory.json").write_text(json.dumps(tasks))

            snapshot = check_metrics(tmpdir)
            self.assertGreater(len(snapshot.alerts_triggered), 0)


class TestCheckAlerts(unittest.TestCase):
    def test_returns_list(self):
        with TemporaryDirectory() as tmpdir:
            alerts = check_alerts(tmpdir)
            self.assertIsInstance(alerts, list)


class TestSaveFiles(unittest.TestCase):
    def test_save_config(self):
        with TemporaryDirectory() as tmpdir:
            config = setup_metrics("saas")
            saved = save_metrics_config(tmpdir, config)
            self.assertEqual(len(saved), 2)
            for f in saved:
                self.assertTrue(Path(f).exists())

    def test_save_snapshot(self):
        with TemporaryDirectory() as tmpdir:
            snapshot = check_metrics(tmpdir)
            path = save_snapshot(tmpdir, snapshot)
            self.assertTrue(Path(path).exists())


if __name__ == "__main__":
    unittest.main()
