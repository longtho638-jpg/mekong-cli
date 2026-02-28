"""Tests for TelemetryCollector execution trace recording."""

import json
import unittest
from pathlib import Path

from src.core.telemetry import TelemetryCollector, ExecutionTrace


class TestTelemetry(unittest.TestCase):
    """Test telemetry collection and trace file output."""

    def test_telemetry_collector_start_and_finish(self):
        """start_trace + finish_trace produces a valid ExecutionTrace."""
        collector = TelemetryCollector()
        collector.start_trace("deploy app")
        trace = collector.finish_trace()

        self.assertIsInstance(trace, ExecutionTrace)
        self.assertEqual(trace.goal, "deploy app")
        self.assertGreaterEqual(trace.total_duration, 0.0)
        self.assertEqual(trace.llm_calls, 0)
        self.assertEqual(trace.errors, [])

    def test_telemetry_record_step(self):
        """record_step appends StepTrace entries to the current trace."""
        collector = TelemetryCollector()
        collector.start_trace("build project")

        collector.record_step(1, "Install deps", 1.23, 0)
        collector.record_step(2, "Run tests", 4.56, 0, self_healed=True, agent="shell")
        collector.record_llm_call()
        collector.record_error("something broke")

        trace = collector.get_trace()
        self.assertIsNotNone(trace)
        self.assertEqual(len(trace.steps), 2)
        self.assertEqual(trace.steps[0].title, "Install deps")
        self.assertAlmostEqual(trace.steps[0].duration_seconds, 1.23, places=2)
        self.assertFalse(trace.steps[0].self_healed)
        self.assertTrue(trace.steps[1].self_healed)
        self.assertEqual(trace.steps[1].agent_used, "shell")
        self.assertEqual(trace.llm_calls, 1)
        self.assertEqual(len(trace.errors), 1)

    def test_telemetry_writes_json_file(self, tmp_path=None):
        """finish_trace writes execution_trace.json to the output directory."""
        import tempfile

        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir) / "telemetry"
            collector = TelemetryCollector(output_dir=str(output_dir))

            collector.start_trace("test goal")
            collector.record_step(1, "echo hello", 0.5, 0)
            collector.finish_trace()

            trace_file = output_dir / "execution_trace.json"
            self.assertTrue(trace_file.exists(), "Trace JSON file not written")

            data = json.loads(trace_file.read_text())
            self.assertEqual(data["goal"], "test goal")
            self.assertEqual(len(data["steps"]), 1)
            self.assertEqual(data["steps"][0]["title"], "echo hello")
            self.assertGreaterEqual(data["total_duration"], 0)


if __name__ == "__main__":
    unittest.main()
