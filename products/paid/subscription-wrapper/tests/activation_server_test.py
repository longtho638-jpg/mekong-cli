import pytest
from fastapi.testclient import TestClient
import hashlib
import time
import os
from unittest.mock import MagicMock, patch

# Set required environment variables before importing the app
os.environ['LICENSE_SECRET'] = 'test_secret_key_for_testing'
os.environ['REDIS_URL'] = 'redis://localhost:6379/0'

# Mock Redis before importing the app
mock_redis = MagicMock()
mock_redis.get.return_value = None
mock_redis.incr.return_value = 1
mock_redis.expire.return_value = True

with patch('redis.from_url', return_value=mock_redis):
    from licensing.server.main import app, SECRET_KEY

client = TestClient(app)

def generate_valid_key(tenant_id="test_tenant"):
    timestamp = int(time.time())
    data = f"{tenant_id}|{timestamp}|{SECRET_KEY}"
    checksum = hashlib.sha256(data.encode()).hexdigest()[:8]
    return f"AGY-{tenant_id}-{timestamp}-{checksum}"

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "activation-server"}

def test_activate_valid_key():
    # Reset mock for this test
    mock_redis.get.return_value = '0'
    mock_redis.incr.return_value = 1

    key = generate_valid_key("client1")
    payload = {
        "license_key": key,
        "machine_fingerprint": "machine-123",
        "tenant_id": "client1"
    }
    response = client.post("/v1/activate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["seats_used"] == 1

def test_activate_invalid_key_format():
    payload = {
        "license_key": "INVALID-KEY-FORMAT",
        "machine_fingerprint": "machine-123",
        "tenant_id": "client1"
    }
    response = client.post("/v1/activate", json=payload)
    assert response.status_code == 400
    assert "Invalid license key" in response.json()["detail"]

def test_activate_tampered_key():
    valid_key = generate_valid_key("client1")
    parts = valid_key.split('-')
    parts[3] = "badsum" # Tamper checksum
    tampered_key = "-".join(parts)

    payload = {
        "license_key": tampered_key,
        "machine_fingerprint": "machine-123",
        "tenant_id": "client1"
    }
    response = client.post("/v1/activate", json=payload)
    assert response.status_code == 400

def test_seat_limit():
    key = generate_valid_key("client_full")
    payload = {
        "license_key": key,
        "machine_fingerprint": "machine-123",
        "tenant_id": "client_full"
    }

    # Mock Redis to simulate filling up seats (limit is 5)
    seat_counter = [0]  # Use list to allow modification in nested function

    def mock_get(key):
        return str(seat_counter[0])

    def mock_incr(key):
        seat_counter[0] += 1
        return seat_counter[0]

    mock_redis.get.side_effect = mock_get
    mock_redis.incr.side_effect = mock_incr

    # Fill up seats
    for i in range(5):
        response = client.post("/v1/activate", json=payload)
        assert response.status_code == 200
        assert response.json()["success"] is True

    # Try 6th activation (should fail)
    response = client.post("/v1/activate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Seat limit reached"

    # Reset mocks
    mock_redis.get.side_effect = None
    mock_redis.incr.side_effect = None
