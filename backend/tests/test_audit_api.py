from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def test_audit_log_endpoint_protected():
    response = client.get("/audit/logs")
    assert response.status_code == 401 # No token

def test_audit_log_access_denied_for_user():
    # Login as user
    login_res = client.post(
        "/token",
        data={"username": "user", "password": "password"},
        headers={"content-type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]

    response = client.get("/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_audit_log_access_allowed_for_admin():
    # Login as admin
    login_res = client.post(
        "/token",
        data={"username": "admin", "password": "secret"},
        headers={"content-type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]

    # We might need to mock file reading if no logs exist,
    # but the endpoint handles empty logs gracefully.
    response = client.get("/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
