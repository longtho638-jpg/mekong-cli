"""Tests for PerfBenchmark module.

Tests cover:
1. record() stores duration and memory
2. check_thresholds() passes when within limits
3. check_thresholds() fails with violations when over limits
4. check_thresholds() raises KeyError for unrecorded step
5. summary() stats: total, avg, slowest, fastest
6. summary() on empty benchmark
7. get_result() returns BenchmarkResult without threshold check
8. clear() removes all records
9. Memory threshold optional (None skips check)
"""

from __future__ import annotations

import unittest

from src.core.perf_benchmark import (
    BenchmarkResult,
    PerfBenchmark,
    PerfThreshold,
)


class TestPerfThresholdDataclass(unittest.TestCase):
    def test_required_field(self):
        t = PerfThreshold(max_duration_ms=500.0)
        self.assertEqual(t.max_duration_ms, 500.0)
        self.assertIsNone(t.max_memory_kb)

    def test_with_memory(self):
        t = PerfThreshold(max_duration_ms=200.0, max_memory_kb=1024.0)
        self.assertEqual(t.max_memory_kb, 1024.0)


class TestBenchmarkResultDataclass(unittest.TestCase):
    def test_defaults(self):
        r = BenchmarkResult(step_order=1, duration_ms=100.0)
        self.assertTrue(r.thresholds_met)
        self.assertEqual(r.violations, [])
        self.assertIsNone(r.memory_peak_kb)


class TestRecord(unittest.TestCase):
    def setUp(self):
        self.bench = PerfBenchmark()

    def test_record_stores_duration(self):
        self.bench.record(step=1, duration=300.0)
        r = self.bench.get_result(1)
        self.assertIsNotNone(r)
        self.assertEqual(r.duration_ms, 300.0)

    def test_record_stores_memory(self):
        self.bench.record(step=2, duration=150.0, memory=2048.0)
        r = self.bench.get_result(2)
        self.assertEqual(r.memory_peak_kb, 2048.0)

    def test_record_overwrites_existing(self):
        self.bench.record(step=1, duration=100.0)
        self.bench.record(step=1, duration=200.0)
        r = self.bench.get_result(1)
        self.assertEqual(r.duration_ms, 200.0)

    def test_get_result_unknown_step_returns_none(self):
        r = self.bench.get_result(99)
        self.assertIsNone(r)


class TestCheckThresholds(unittest.TestCase):
    def setUp(self):
        self.bench = PerfBenchmark()

    def test_within_duration_threshold(self):
        self.bench.record(step=1, duration=100.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0))
        self.assertTrue(result.thresholds_met)
        self.assertEqual(result.violations, [])

    def test_exceeds_duration_threshold(self):
        self.bench.record(step=1, duration=600.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0))
        self.assertFalse(result.thresholds_met)
        self.assertEqual(len(result.violations), 1)
        self.assertIn("600.0ms", result.violations[0])

    def test_within_memory_threshold(self):
        self.bench.record(step=1, duration=100.0, memory=512.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0, max_memory_kb=1024.0))
        self.assertTrue(result.thresholds_met)

    def test_exceeds_memory_threshold(self):
        self.bench.record(step=1, duration=100.0, memory=2048.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0, max_memory_kb=1024.0))
        self.assertFalse(result.thresholds_met)
        self.assertEqual(len(result.violations), 1)
        self.assertIn("2048.0KB", result.violations[0])

    def test_both_violations(self):
        self.bench.record(step=1, duration=1000.0, memory=2048.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0, max_memory_kb=1024.0))
        self.assertFalse(result.thresholds_met)
        self.assertEqual(len(result.violations), 2)

    def test_unrecorded_step_raises_key_error(self):
        with self.assertRaises(KeyError):
            self.bench.check_thresholds(99, PerfThreshold(max_duration_ms=500.0))

    def test_memory_threshold_none_skips_memory_check(self):
        self.bench.record(step=1, duration=100.0, memory=9999.0)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0, max_memory_kb=None))
        self.assertTrue(result.thresholds_met)

    def test_no_memory_recorded_skips_memory_check(self):
        self.bench.record(step=1, duration=100.0, memory=None)
        result = self.bench.check_thresholds(1, PerfThreshold(max_duration_ms=500.0, max_memory_kb=1024.0))
        self.assertTrue(result.thresholds_met)


class TestSummary(unittest.TestCase):
    def setUp(self):
        self.bench = PerfBenchmark()

    def test_empty_summary(self):
        s = self.bench.summary()
        self.assertEqual(s["total_steps"], 0)
        self.assertEqual(s["total_duration_ms"], 0.0)
        self.assertEqual(s["avg_duration_ms"], 0.0)
        self.assertIsNone(s["slowest_step"])
        self.assertIsNone(s["fastest_step"])

    def test_single_step_summary(self):
        self.bench.record(step=1, duration=200.0)
        s = self.bench.summary()
        self.assertEqual(s["total_steps"], 1)
        self.assertEqual(s["total_duration_ms"], 200.0)
        self.assertEqual(s["avg_duration_ms"], 200.0)
        self.assertEqual(s["slowest_step"], 1)
        self.assertEqual(s["fastest_step"], 1)

    def test_multiple_steps_summary(self):
        self.bench.record(step=1, duration=100.0)
        self.bench.record(step=2, duration=300.0)
        self.bench.record(step=3, duration=200.0)
        s = self.bench.summary()
        self.assertEqual(s["total_steps"], 3)
        self.assertAlmostEqual(s["total_duration_ms"], 600.0)
        self.assertAlmostEqual(s["avg_duration_ms"], 200.0)
        self.assertEqual(s["slowest_step"], 2)
        self.assertEqual(s["fastest_step"], 1)


class TestClear(unittest.TestCase):
    def test_clear_removes_all(self):
        bench = PerfBenchmark()
        bench.record(step=1, duration=100.0)
        bench.record(step=2, duration=200.0)
        bench.clear()
        s = bench.summary()
        self.assertEqual(s["total_steps"], 0)
        self.assertIsNone(bench.get_result(1))


if __name__ == "__main__":
    unittest.main()
