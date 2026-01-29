from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.auth.dependencies import get_current_user
from backend.api.routers.developers import get_api_key_service, router
from backend.services.api_key_service import ApiKeyService
from core.infrastructure.database import get_db

# Create a FastAPI app for testing the router in isolation
app = FastAPI()
app.include_router(router)

client = TestClient(app)

# Mock User Data
MOCK_USER_ID = str(uuid4())
MOCK_USER = {"id": MOCK_USER_ID, "username": "testuser", "role": "user"}


@pytest.fixture
def mock_db_session():
    return MagicMock()


@pytest.fixture
def mock_api_key_service():
    return MagicMock(spec=ApiKeyService)


@pytest.fixture
def override_dependencies(mock_db_session, mock_api_key_service):
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    app.dependency_overrides[get_db] = lambda: mock_db_session
    app.dependency_overrides[get_api_key_service] = lambda: mock_api_key_service
    yield
    app.dependency_overrides = {}


def test_list_api_keys(override_dependencies, mock_api_key_service):
    mock_keys = [
        {
            "id": uuid4(),
            "user_id": uuid4(),
            "name": "Test Key",
            "prefix": "aky_test_...",
            "scopes": ["read"],
            "tier": "free",
            "status": "active",
            "created_at": datetime.utcnow(),
        }
    ]
    mock_api_key_service.list_api_keys.return_value = mock_keys

    response = client.get("/developers/keys")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Key"
    mock_api_key_service.list_api_keys.assert_called_once_with(MOCK_USER_ID)


def test_create_api_key(override_dependencies, mock_api_key_service):
    key_data = {"name": "New Key", "scopes": ["full_access"]}
    mock_response = {
        "id": uuid4(),
        "user_id": uuid4(),
        "name": "New Key",
        "prefix": "aky_live_...",
        "scopes": ["full_access"],
        "tier": "free",
        "status": "active",
        "created_at": datetime.utcnow(),
        "key": "aky_live_full_secret_key",
    }
    mock_api_key_service.generate_api_key.return_value = mock_response

    response = client.post("/developers/keys", json=key_data)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Key"
    assert data["key"] == "aky_live_full_secret_key"
    mock_api_key_service.generate_api_key.assert_called_once()


def test_revoke_api_key(override_dependencies, mock_api_key_service):
    key_id = "some-key-id"
    mock_api_key_service.revoke_api_key.return_value = True

    response = client.delete(f"/developers/keys/{key_id}")

    assert response.status_code == 200
    assert response.json() == {"status": "revoked"}
    mock_api_key_service.revoke_api_key.assert_called_once_with(key_id, MOCK_USER_ID)


def test_rotate_api_key(override_dependencies, mock_api_key_service):
    key_id = "some-key-id"
    mock_response = {
        "id": uuid4(),
        "user_id": uuid4(),
        "name": "Rotated Key",
        "prefix": "aky_live_new...",
        "scopes": ["read"],
        "tier": "free",
        "status": "active",
        "created_at": datetime.utcnow(),
        "key": "aky_live_new_secret_key",
    }
    mock_api_key_service.rotate_api_key.return_value = mock_response

    response = client.post(f"/developers/keys/{key_id}/rotate")

    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "aky_live_new_secret_key"
    mock_api_key_service.rotate_api_key.assert_called_once_with(key_id, MOCK_USER_ID)


def test_usage_stats_chart_data(override_dependencies, mock_db_session):
    # Mock finding API keys for user
    mock_key_id = str(uuid4())
    mock_db_session.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": mock_key_id}
    ]

    # Mock usage data
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)

    mock_usage_records = [
        # Today: 1 success, 1 error
        {
            "endpoint": "/api/v1/test",
            "status_code": 200,
            "response_time_ms": 100,
            "created_at": now.isoformat(),
        },
        {
            "endpoint": "/api/v1/test",
            "status_code": 500,
            "response_time_ms": 50,
            "created_at": now.isoformat(),
        },
        # Yesterday: 1 success
        {
            "endpoint": "/api/v1/test",
            "status_code": 200,
            "response_time_ms": 120,
            "created_at": yesterday.isoformat(),
        },
    ]

    # Mock usage query chain
    # This is a bit brittle due to the fluent chain structure of PostgREST client mocking
    # table("api_usage").select("*").in_("api_key_id", ...).gte("created_at", ...).execute()
    _ = MagicMock()
    mock_db_session.table.return_value.select.return_value.in_.return_value.gte.return_value.execute.return_value.data = mock_usage_records

    response = client.get("/developers/usage/stats?days=7")

    assert response.status_code == 200
    data = response.json()

    assert data["total_requests"] == 3
    assert data["requests_by_status"]["200"] == 2
    assert data["requests_by_status"]["500"] == 1

    # Check chart data
    assert "chart_data" in data
    assert len(data["chart_data"]) == 7  # requested 7 days

    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = yesterday.strftime("%Y-%m-%d")

    today_stats = next(d for d in data["chart_data"] if d["date"] == today_str)
    yesterday_stats = next(d for d in data["chart_data"] if d["date"] == yesterday_str)

    assert today_stats["requests"] == 2
    assert today_stats["errors"] == 1
    assert yesterday_stats["requests"] == 1
    assert yesterday_stats["errors"] == 0


def test_create_webhook(override_dependencies, mock_db_session):
    # Mock user owning the API key
    key_id = str(uuid4())
    mock_db_session.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": key_id}
    ]

    # Mock insert response
    new_webhook_id = str(uuid4())
    mock_db_session.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": new_webhook_id,
            "url": "https://example.com/webhook",
            "events": ["*"],
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "secret": "whsec_test",
        }
    ]

    payload = {
        "config": {"url": "https://example.com/webhook", "events": ["*"]},
        "api_key_id": key_id,
    }

    response = client.post("/developers/webhooks", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/webhook"
    assert data["secret"] == "whsec_test"
