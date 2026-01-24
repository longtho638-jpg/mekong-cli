"""
Tests for Performance Monitoring Middleware
"""

import pytest
import time
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from backend.middleware.performance import (
    PerformanceMonitoringMiddleware,
    get_metrics_summary,
    reset_metrics,
)


@pytest.fixture
def app():
    """Create test FastAPI app with performance middleware"""
    test_app = FastAPI()
    test_app.add_middleware(PerformanceMonitoringMiddleware)

    @test_app.get("/fast")
    async def fast_endpoint():
        return {"message": "fast"}

    @test_app.get("/slow")
    async def slow_endpoint():
        await asyncio.sleep(0.6)  # Simulate slow query (>500ms)
        return {"message": "slow"}

    return test_app


@pytest.fixture
def client(app):
    """Create test client"""
    reset_metrics()  # Reset metrics before each test
    return TestClient(app)


def test_middleware_adds_response_time_header(client):
    """Test that X-Response-Time header is added"""
    response = client.get("/fast")
    assert response.status_code == 200
    assert "X-Response-Time" in response.headers
    assert response.headers["X-Response-Time"].endswith("ms")


def test_middleware_tracks_requests(client):
    """Test that middleware tracks requests in metrics"""
    # Make several requests
    for _ in range(5):
        client.get("/fast")

    # Get metrics
    metrics = get_metrics_summary()
    assert metrics["total_requests"] >= 5
    assert metrics["avg_response_time"] > 0


def test_slow_query_detection(client):
    """Test that slow queries (>500ms) are detected"""
    import asyncio

    # Create app with async sleep
    app = FastAPI()
    app.add_middleware(PerformanceMonitoringMiddleware)

    @app.get("/slow")
    async def slow_endpoint():
        await asyncio.sleep(0.6)  # 600ms - should be flagged as slow
        return {"message": "slow"}

    test_client = TestClient(app)
    reset_metrics()

    # Make slow request
    response = test_client.get("/slow")
    assert response.status_code == 200

    # Check metrics
    metrics = get_metrics_summary()
    assert metrics["slow_queries_count"] > 0


def test_percentile_calculations(client):
    """Test percentile calculations"""
    # Make requests
    for _ in range(20):
        client.get("/fast")

    metrics = get_metrics_summary()
    assert "p50" in metrics
    assert "p95" in metrics
    assert "p99" in metrics
    assert metrics["p50"] <= metrics["p95"] <= metrics["p99"]


def test_endpoint_breakdown(client):
    """Test per-endpoint metrics breakdown"""
    # Make requests to different endpoints
    for _ in range(3):
        client.get("/fast")

    metrics = get_metrics_summary()
    assert "endpoint_breakdown" in metrics
    assert "GET /fast" in metrics["endpoint_breakdown"]

    endpoint_stats = metrics["endpoint_breakdown"]["GET /fast"]
    assert "avg" in endpoint_stats
    assert "count" in endpoint_stats
    assert endpoint_stats["count"] == 3


def test_metrics_reset():
    """Test that reset_metrics clears all data"""
    # Make some requests
    app = FastAPI()
    app.add_middleware(PerformanceMonitoringMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"ok": True}

    client = TestClient(app)
    client.get("/test")

    # Verify metrics exist
    metrics = get_metrics_summary()
    assert metrics["total_requests"] > 0

    # Reset
    reset_metrics()

    # Verify metrics cleared
    metrics = get_metrics_summary()
    assert metrics["total_requests"] == 0
    assert metrics["slow_queries_count"] == 0
