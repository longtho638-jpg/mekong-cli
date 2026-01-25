#!/usr/bin/env python3
"""
Performance Middleware Verification Script
Demonstrates that the middleware is working correctly
"""

import asyncio
import time

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.middleware.performance import (
    PerformanceMonitoringMiddleware,
    get_metrics_summary,
    reset_metrics,
)


def verify_middleware():
    """Verify performance middleware is working"""

    print("🔍 Performance Middleware Verification\n")
    print("=" * 60)

    # Create test app
    app = FastAPI()
    app.add_middleware(PerformanceMonitoringMiddleware)

    @app.get("/fast")
    async def fast_endpoint():
        return {"message": "fast response"}

    @app.get("/medium")
    async def medium_endpoint():
        await asyncio.sleep(0.2)  # 200ms
        return {"message": "medium response"}

    @app.get("/slow")
    async def slow_endpoint():
        await asyncio.sleep(0.6)  # 600ms - should be flagged
        return {"message": "slow response"}

    client = TestClient(app)
    reset_metrics()

    # Test 1: X-Response-Time Header
    print("\n✓ Test 1: X-Response-Time Header")
    response = client.get("/fast")
    response_time = response.headers.get("X-Response-Time", "NOT FOUND")
    print(f"  Response time header: {response_time}")
    assert "ms" in response_time, "Response time header missing!"

    # Test 2: Multiple requests tracking
    print("\n✓ Test 2: Request Tracking")
    for i in range(10):
        endpoint = ["/fast", "/medium", "/slow"][i % 3]
        client.get(endpoint)
        time.sleep(0.1)

    metrics = get_metrics_summary()
    print(f"  Total requests tracked: {metrics['total_requests']}")
    print(f"  Average response time: {metrics['avg_response_time']:.2f}ms")
    assert metrics['total_requests'] >= 11, "Requests not tracked!"

    # Test 3: Slow query detection
    print("\n✓ Test 3: Slow Query Detection (>500ms)")
    print(f"  Slow queries detected: {metrics['slow_queries_count']}")
    assert metrics['slow_queries_count'] > 0, "Slow queries not detected!"

    if metrics['slow_queries']:
        for query in metrics['slow_queries'][:3]:
            print(f"    - {query['endpoint']}: {query['duration_ms']:.2f}ms")

    # Test 4: Percentile calculations
    print("\n✓ Test 4: Percentile Calculations")
    print(f"  P50 (median): {metrics['p50']:.2f}ms")
    print(f"  P95: {metrics['p95']:.2f}ms")
    print(f"  P99: {metrics['p99']:.2f}ms")
    assert metrics['p50'] <= metrics['p95'] <= metrics['p99'], "Percentiles incorrect!"

    # Test 5: Endpoint breakdown
    print("\n✓ Test 5: Per-Endpoint Metrics")
    for endpoint, stats in metrics['endpoint_breakdown'].items():
        print(f"  {endpoint}:")
        print(f"    Count: {stats['count']}, Avg: {stats['avg']:.2f}ms, "
              f"Min: {stats['min']:.2f}ms, Max: {stats['max']:.2f}ms")

    # Summary
    print("\n" + "=" * 60)
    print("✅ All verification tests passed!")
    print("\nMiddleware is working correctly and tracking:")
    print("  • Request durations")
    print("  • Slow queries (>500ms)")
    print("  • X-Response-Time headers")
    print("  • Per-endpoint performance breakdown")
    print("  • Percentile calculations (p50, p95, p99)")
    print("\n💡 Access metrics via: GET /metrics")
    print("=" * 60)


if __name__ == "__main__":
    verify_middleware()
