import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import sys
from datetime import datetime

# Import the app
from backend.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_get_monitor_status_success():
    """Test successful monitor status retrieval."""
    mock_dashboard_data = {
        "timestamp": datetime.now().isoformat(),
        "systems": {
            "proxy": {
                "name": "proxy",
                "status": "healthy",
                "message": "Antigravity Proxy running at :8080",
                "last_check": datetime.now().isoformat(),
                "details": {}
            },
            "vercel": {
                "name": "vercel",
                "status": "healthy",
                "message": "3 recent deployments OK",
                "last_check": datetime.now().isoformat(),
                "details": {"deployments": 3}
            }
        },
        "anomalies": [],
        "summary": "2 systems monitored, 0 anomalies detected"
    }

    # Patch CommanderHandler.get_dashboard
    with patch("antigravity.mcp_servers.commander_server.handlers.CommanderHandler.get_dashboard", new_callable=AsyncMock) as mock_get_dashboard:
        mock_get_dashboard.return_value = mock_dashboard_data

        response = client.get("/monitor/status")

        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "2 systems monitored, 0 anomalies detected"
        assert "proxy" in data["systems"]
        assert data["systems"]["proxy"]["status"] == "healthy"
        assert len(data["anomalies"]) == 0

@pytest.mark.asyncio
async def test_get_monitor_status_with_anomalies():
    """Test monitor status retrieval with anomalies."""
    mock_dashboard_data = {
        "timestamp": datetime.now().isoformat(),
        "systems": {
            "proxy": {
                "name": "proxy",
                "status": "error",
                "message": "Proxy not responding",
                "last_check": datetime.now().isoformat(),
                "details": {}
            }
        },
        "anomalies": [
            {
                "system": "proxy",
                "type": "ERROR",
                "message": "Proxy not responding",
                "severity": "HIGH",
                "recovery_action": "Run: antigravity-claude-proxy start"
            }
        ],
        "summary": "1 systems monitored, 1 anomalies detected"
    }

    with patch("antigravity.mcp_servers.commander_server.handlers.CommanderHandler.get_dashboard", new_callable=AsyncMock) as mock_get_dashboard:
        mock_get_dashboard.return_value = mock_dashboard_data

        response = client.get("/monitor/status")

        assert response.status_code == 200
        data = response.json()
        assert data["systems"]["proxy"]["status"] == "error"
        assert len(data["anomalies"]) == 1
        assert data["anomalies"][0]["severity"] == "HIGH"

@pytest.mark.asyncio
async def test_get_monitor_status_error():
    """Test monitor status retrieval when an exception occurs."""
    with patch("antigravity.mcp_servers.commander_server.handlers.CommanderHandler.get_dashboard", side_effect=Exception("Database connection failed")):
        response = client.get("/monitor/status")

        # The router has a try-except block that returns a summary with the error message
        assert response.status_code == 200
        data = response.json()
        assert "Error fetching status: Database connection failed" in data["summary"]
        assert data["systems"] == {}
        assert data["anomalies"] == []
