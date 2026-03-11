"""E2E tests for critical API flows."""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """E2E: Verify system health check returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data
