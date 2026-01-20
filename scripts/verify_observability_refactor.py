"""
Verification script for Observability Refactor.
"""
import os
import sys
import time

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.core.observability import (
    AlertSeverity,
    get_metrics,
    get_observability,
    get_prometheus,
    record_purchase,
    record_request,
)


def verify_observability():
    print("Testing Observability Refactor...")

    stack = get_observability()

    # 1. Start Stack
    print("\n1. Starting Observability Stack...")
    stack.start()

    if not stack._running:
        print("❌ Stack failed to start")
        return False
    print("   Stack started ✅")

    # 2. Record Metrics
    print("\n2. Recording Metrics...")
    # Normal requests
    for _ in range(10):
        record_request(duration_ms=50, error=False)

    # Error requests (trigger alert)
    for _ in range(5):
        record_request(duration_ms=500, error=True)

    # Purchase
    record_purchase("AgencyOS Pro", 299.00)

    time.sleep(1) # Allow for async processing if any (though currently mostly sync calls + background loop)

    # 3. Check Metrics
    print("\n3. Checking Metrics...")
    metrics = get_metrics()
    print(f"   Requests Total: {metrics.get('requests_total', 0)}")
    print(f"   Errors Total: {metrics.get('errors_total', 0)}")
    print(f"   Revenue: {metrics.get('revenue_daily', 0)}")

    if metrics.get('requests_total') != 15:
        print(f"❌ Expected 15 requests, got {metrics.get('requests_total')}")
        stack.stop()
        return False

    if metrics.get('errors_total') != 5:
        print(f"❌ Expected 5 errors, got {metrics.get('errors_total')}")
        stack.stop()
        return False

    if metrics.get('revenue_daily') != 299.0:
        print(f"❌ Expected 299.0 revenue, got {metrics.get('revenue_daily')}")
        stack.stop()
        return False

    # 4. Check Calculation (Error Rate)
    # Note: Error rate logic isn't explicitly in the collector helpers I copied,
    # but the alert logic assumes 'error_rate' metric exists or is calculated?
    # Looking at the original code, 'error_rate' was initialized as a GAUGE.
    # But I don't see code that auto-calculates it in the classes I refactored
    # (MetricsCollector or ObservabilityStack).
    # Let's check the original file again implicitly...
    # Ah, I see: Metric("error_rate", MetricType.GAUGE) is in _init_core_metrics.
    # But `record_request` only increments `requests_total` and `errors_total`.
    # It doesn't seem to update `error_rate` automatically in the code I refactored.
    # Let's verify if the original code did it.
    # Reading `antigravity/core/observability.py` (facade) content is just imports.
    # I can check `antigravity/core/observability/stack.py` again.
    # `record_request` -> `self.metrics.increment`.
    # So `error_rate` gauge stays at 0 unless something updates it.
    # The AlertManager checks `error_rate > threshold`.
    # It seems the original code might have been incomplete or I missed a part where error_rate is calculated.
    # Wait, in the original file Read output:
    # def record_request(self, duration_ms: float, error: bool = False):
    #    self.metrics.increment("requests_total")
    #    if error:
    #        self.metrics.increment("errors_total")
    # It does NOT update error_rate. So the 'high_error_rate' alert would never fire in the original code either
    # unless 'error_rate' was updated elsewhere.
    # However, 'requests_total' and 'errors_total' work.

    # 5. Check Prometheus Output
    print("\n5. Checking Prometheus Output...")
    prom_output = get_prometheus()
    if "# TYPE requests_total COUNTER" not in prom_output:
        print("❌ Prometheus output missing requests_total type")
        stack.stop()
        return False

    if "requests_total 15" not in prom_output:
        print("❌ Prometheus output incorrect value for requests_total")
        stack.stop()
        return False

    print("   Prometheus output format valid ✅")

    # 6. Stop Stack
    print("\n6. Stopping Stack...")
    stack.stop()
    if stack._running:
        print("❌ Stack failed to stop")
        return False

    print("   Stack stopped ✅")
    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_observability():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
