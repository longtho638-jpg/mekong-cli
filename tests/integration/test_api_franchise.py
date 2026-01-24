import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys

from backend.api.main import app
from backend.core.security.rbac import require_viewer, require_admin

# Override authentication dependencies
app.dependency_overrides[require_viewer] = lambda: MagicMock(role="viewer")
app.dependency_overrides[require_admin] = lambda: MagicMock(role="admin")

client = TestClient(app)

@pytest.fixture
def mock_franchise_system():
    # We need to mock the FranchiseSystem class and the FRANCHISE_AVAILABLE constant
    # Since the module is already imported in main, we might need to patch where it is used.
    # However, backend.api.routers.franchise imports FranchiseSystem at module level.
    # If it failed import, FRANCHISE_AVAILABLE is False.

    # We'll use patch.object on the module to force FRANCHISE_AVAILABLE = True
    # and mock the franchise instance.

    with patch("backend.api.routers.franchise.FRANCHISE_AVAILABLE", True), \
         patch("backend.api.routers.franchise.franchise") as mock_instance:
        yield mock_instance

def test_get_franchise_stats(mock_franchise_system):
    mock_franchise_system.get_network_stats.return_value = {
        "total_franchisees": 10,
        "active_territories": 15,
        "total_revenue": 500000
    }

    response = client.get("/api/franchise/stats")

    assert response.status_code == 200
    data = response.json()
    assert data["total_franchisees"] == 10
    assert data["total_revenue"] == 500000

def test_get_hq_revenue(mock_franchise_system):
    mock_franchise_system.get_hq_revenue.return_value = {
        "monthly_recurring": 20000,
        "one_time_fees": 50000
    }

    response = client.get("/api/franchise/hq-revenue")

    assert response.status_code == 200
    data = response.json()
    assert data["monthly_recurring"] == 20000

def test_get_territories(mock_franchise_system):
    # Mock territory objects
    t1 = MagicMock()
    t1.id = "t1"
    t1.country = "Vietnam"
    t1.region = "South"
    t1.city = "Ho Chi Minh City"
    t1.population = 9000
    t1.status.value = "active"

    t2 = MagicMock()
    t2.id = "t2"
    t2.country = "Singapore"
    t2.region = "Central"
    t2.city = "Singapore"
    t2.population = 6000
    t2.status.value = "pending"

    mock_franchise_system.territories = {"t1": t1, "t2": t2}

    # Test get all
    response = client.get("/api/franchise/territories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Test filter
    response = client.get("/api/franchise/territories?country=Vietnam")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["city"] == "Ho Chi Minh City"

def test_get_franchisees(mock_franchise_system):
    f1 = MagicMock()
    f1.id = "f1"
    f1.name = "Nguyen Van A"
    f1.company = "A Corp"
    f1.tier.value = "gold"
    f1.status.value = "active"
    f1.territories = ["t1"]
    f1.monthly_fee = 1000

    mock_franchise_system.franchisees = {"f1": f1}

    response = client.get("/api/franchise/franchisees")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Nguyen Van A"
    assert data[0]["tier"] == "gold"

def test_franchise_unavailable():
    with patch("backend.api.routers.franchise.FRANCHISE_AVAILABLE", False):
        response = client.get("/api/franchise/stats")
        assert response.status_code == 500
        assert response.json()["detail"] == "Franchise not available"
