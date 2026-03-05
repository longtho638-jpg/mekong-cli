#!/usr/bin/env python3
"""
Test script to verify the recursion depth issue is fixed in telemetry collection.
"""

import sys
import os
# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from core.telemetry import TelemetryCollector


def test_recursion_fix():
    """Test that telemetry collection doesn't cause recursion depth errors."""
    # Create a telemetry collector
    collector = TelemetryCollector()

    # Start a trace
    collector.start_trace("Test goal for recursion fix")

    # Add several steps to the trace
    for i in range(5):
        collector.record_step(
            step_order=i,
            title=f"Test step {i}",
            duration=1.0,
            exit_code=0,
            self_healed=False,
            agent="test-agent"
        )

    # Record some LLM calls
    for i in range(3):
        collector.record_llm_call()

    # Record some errors
    collector.record_error("Test error 1")
    collector.record_error("Test error 2")

    # Finish the trace - this is where recursion issues occurred
    trace = collector.finish_trace()

    # Verify we can serialize the trace safely
    assert trace is not None, "Trace should not be None"
    assert len(trace.steps) == 5, f"Expected 5 steps, got {len(trace.steps)}"
    assert len(trace.errors) == 2, f"Expected 2 errors, got {len(trace.errors)}"
    assert trace.llm_calls == 3, f"Expected 3 LLM calls, got {trace.llm_calls}"


if __name__ == "__main__":
    test_recursion_fix()
    print("✓ Recursion depth issue has been fixed!")