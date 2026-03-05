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
    print("Testing comprehensive telemetry with orchestrator scenario...")

    try:
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
        trace = collector.finish_trace()  # Used below for validation

        if trace:
            print("✓ Trace completed successfully")
            print(f"  - Goal: {trace.goal}")
            print(f"  - Steps: {len(trace.steps)}")
            print(f"  - Total duration: {trace.total_duration}s")
            print(f"  - LLM calls: {trace.llm_calls}")
            print(f"  - Errors: {len(trace.errors)}")

            # Validate individual steps
            successful_steps = sum(1 for step in trace.steps if step.exit_code == 0)
            healed_steps = sum(1 for step in trace.steps if step.self_healed)
            print(f"  - Successful steps: {successful_steps}")
            print(f"  - Self-healed steps: {healed_steps}")

            # Test that we can access the trace properties without issues
            print("  - Trace properties accessible: ✓")

        print("✓ Comprehensive telemetry test passed!")
        return True

    except RecursionError as e:
        print(f"✗ RecursionError still occurs: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"✗ Other error occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nested_serialization():
    """Test nested serialization scenarios that could cause recursion."""
    print("\nTesting nested serialization scenarios...")

    try:
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
        collector.finish_trace()
        print("✓ Nested serialization test passed!")
        return True

    except RecursionError as e:
        print(f"✗ RecursionError in nested test: {e}")
        return False
    except Exception as e:
        print(f"✗ Error in nested test: {e}")
        return False


if __name__ == "__main__":
    print("Running comprehensive telemetry recursion tests...\n")

    success1 = test_comprehensive_telemetry()
    success2 = test_nested_serialization()

    if success1 and success2:
        print("\n✓ All telemetry recursion tests passed!")
        print("The recursion depth issue has been successfully fixed.")
        sys.exit(0)
    else:
        print("\n✗ Some telemetry recursion tests failed!")
        sys.exit(1)