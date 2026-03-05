#!/usr/bin/env python3
"""
Comprehensive test for the telemetry recursion fix with more realistic scenario.
"""

import sys
import os
# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from core.telemetry import TelemetryCollector


def test_comprehensive_telemetry():
    """Test telemetry collection with more realistic orchestrator scenario."""
    # Create a telemetry collector
    collector = TelemetryCollector()

    # Start a trace simulating a real goal
    collector.start_trace("Implement algo-trader retry mechanism", user_id="test-user-123")

    # Simulate multiple steps like a real recipe would have
    for i in range(10):  # More steps to stress test
        collector.record_step(
            step_order=i,
            title=f"Step {i}: Perform operation",
            duration=float(i + 1),
            exit_code=0 if i != 7 else 1,  # Simulate one failed step
            self_healed=(i == 7),  # Step 7 gets self-healed
            agent="test-agent" if i % 2 == 0 else "llm-agent"
        )

        # Occasionally record LLM calls
        if i % 3 == 0:
            collector.record_llm_call(model="test-model", input_tokens=100, output_tokens=50)

    # Record some errors like a real system would
    collector.record_error("Network timeout occurred during API call")
    collector.record_error("Permission denied for file access")

    # Add more complex error scenarios
    for i in range(5):
        collector.record_error(f"Transient error in subsystem {i}")

    # Finish the trace - main point where recursion occurred
    trace = collector.finish_trace()

    # Validate trace
    assert trace is not None, "Trace should not be None"
    assert len(trace.steps) == 10, f"Expected 10 steps, got {len(trace.steps)}"
    successful_steps = sum(1 for step in trace.steps if step.exit_code == 0)
    healed_steps = sum(1 for step in trace.steps if step.self_healed)
    assert successful_steps == 9, f"Expected 9 successful steps, got {successful_steps}"
    assert healed_steps == 1, f"Expected 1 healed step, got {healed_steps}"
    assert len(trace.errors) == 7, f"Expected 7 errors, got {len(trace.errors)}"


def test_nested_serialization():
    """Test nested serialization scenarios that could cause recursion."""
    collector = TelemetryCollector()
    collector.start_trace("Nested serialization test")

    # Add many steps to potentially create complex nested structures
    for i in range(20):
        collector.record_step(
            step_order=i,
            title=f"Complex step {i} with detailed information",
            duration=1.5,
            exit_code=0,
            self_healed=False,
            agent=f"agent_{i % 5}"  # Cycle through 5 different agents
        )

        # Occasional LLM calls
        if i % 4 == 0:
            collector.record_llm_call()

    # Add multiple errors
    for i in range(10):
        collector.record_error(f"Error #{i} in complex scenario")

    # Finish trace
    trace = collector.finish_trace()

    # Validate
    assert trace is not None, "Trace should not be None"
    assert len(trace.steps) == 20, f"Expected 20 steps, got {len(trace.steps)}"
    assert len(trace.errors) == 10, f"Expected 10 errors, got {len(trace.errors)}"


if __name__ == "__main__":
    test_comprehensive_telemetry()
    test_nested_serialization()
    print("✓ All telemetry recursion tests passed!")