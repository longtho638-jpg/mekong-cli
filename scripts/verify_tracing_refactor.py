"""
Verification script for Tracing Refactor.
"""
import os
import sys
import time

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.core.tracing import (
    SpanKind,
    SpanStatus,
    end_span,
    get_trace_id,
    get_tracer,
    start_span,
    start_trace,
    trace_function,
)


@trace_function("decorated_operation")
def decorated_function(arg):
    print(f"   Executing decorated function with {arg}")
    time.sleep(0.1)
    return f"Result: {arg}"

def verify_tracing():
    print("Testing Tracing Refactor...")

    tracer = get_tracer()

    # 1. Start Trace
    print("\n1. Starting Trace...")
    root_span = start_trace("root_operation")
    trace_id = get_trace_id()

    print(f"   Trace started. ID: {trace_id}")
    if not trace_id:
        print("❌ Failed to get trace ID")
        return False

    if root_span.trace_id != trace_id:
        print("❌ Trace ID mismatch")
        return False

    # 2. Start Child Span
    print("\n2. Starting Child Span...")
    child_span = start_span("child_operation")
    child_span.set_attribute("test_attr", "value")

    print(f"   Child span started: {child_span.span_id}")
    time.sleep(0.05)

    # 3. End Child Span
    print("\n3. Ending Child Span...")
    end_span(child_span, SpanStatus.OK)
    print("   Child span ended")

    # 4. Decorated Function
    print("\n4. Testing Decorator...")
    result = decorated_function("test_arg")
    print(f"   Decorated function result: {result}")

    # 5. End Root Span
    print("\n5. Ending Root Span...")
    end_span(root_span, SpanStatus.OK)
    print("   Root span ended")

    # 6. Check Exporter
    print("\n6. Checking Exporter...")
    spans = tracer.get_recent_spans()
    print(f"   Total spans recorded: {len(spans)}")

    # We expect at least 3 spans: root, child, decorated
    if len(spans) < 3:
        print(f"❌ Expected at least 3 spans, got {len(spans)}")
        return False

    # Check span names
    span_names = [s["name"] for s in spans]
    print(f"   Span names: {span_names}")

    if "root_operation" not in span_names:
        print("❌ Missing root span")
        return False
    if "child_operation" not in span_names:
        print("❌ Missing child span")
        return False
    if "decorated_operation" not in span_names:
        print("❌ Missing decorated span")
        return False

    # Check trace ID linking
    trace_ids = set(s["traceId"] for s in spans)
    if len(trace_ids) != 1:
        print(f"❌ Spans should belong to same trace, found IDs: {trace_ids}")
        # Note: Depending on implementation, decorated might start new trace if context lost,
        # but here it runs synchronously so context should propagate.
        return False

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_tracing():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
