import sys
import types
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.api.routers import crm
from backend.core.security.rbac import require_developer, require_viewer

# Override authentication dependencies for testing
app.dependency_overrides[require_viewer] = lambda: MagicMock(role="viewer")
app.dependency_overrides[require_developer] = lambda: MagicMock(role="developer")

client = TestClient(app)

@pytest.fixture
def mock_crm():
    # Mock the CRM class and instance
    with patch("backend.api.routers.crm._get_crm") as mock_get:
        mock_instance = MagicMock()
        mock_get.return_value = mock_instance
        yield mock_instance

def test_get_crm_summary_success(mock_crm):
    # Setup mock return
    mock_crm.get_summary.return_value = {
        "total_revenue": 100000,
        "active_deals": 5,
        "conversion_rate": 0.25
    }

    response = client.get("/api/crm/summary")

    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["total_revenue"] == 100000
    assert data["active_deals"] == 5
    mock_crm.get_summary.assert_called_once()

def test_get_crm_deals(mock_crm):
    # Setup mock deals
    mock_deal = MagicMock()
    mock_deal.id = "deal-1"
    mock_deal.title = "Big Contract"
    mock_deal.value = 50000
    mock_deal.stage.value = "negotiation"
    mock_deal.contact_id = "contact-1"

    mock_crm.deals = {"deal-1": mock_deal}

    response = client.get("/api/crm/deals")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "deal-1"
    assert data[0]["title"] == "Big Contract"

def test_get_crm_contacts(mock_crm):
    # Setup mock contacts
    mock_contact = MagicMock()
    mock_contact.id = "contact-1"
    mock_contact.name = "Alice"
    mock_contact.email = "alice@example.com"
    mock_contact.company = "Wonderland Inc"
    mock_contact.lead_score = 90

    mock_crm.contacts = {"contact-1": mock_contact}

    response = client.get("/api/crm/contacts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Alice"
    assert data[0]["email"] == "alice@example.com"

def test_get_crm_unavailable():
    # Test when CRM is None
    with patch("backend.api.routers.crm._get_crm", return_value=None):
        response = client.get("/api/crm/summary")
        assert response.status_code == 500
        assert response.json()["detail"] == "CRM not available"
