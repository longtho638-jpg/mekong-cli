from fastapi.testclient import TestClient
from backend.main import app
from backend.api.auth.utils import create_access_token, get_password_hash
from backend.api.auth.router import fake_users_db
import pytest

client = TestClient(app)

@pytest.mark.skip(reason="Requires running redis/falkordb service")
def test_login_success():
    response = client.post(
        "/token",
        data={"username": "admin", "password": "secret"},
        headers={"content-type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

@pytest.mark.skip(reason="Requires running redis/falkordb service")
def test_login_failure():
    response = client.post(
        "/token",
        data={"username": "admin", "password": "wrongpassword"},
        headers={"content-type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.skip(reason="Requires running redis/falkordb service")
def test_websocket_auth_failure():
    with pytest.raises(Exception): # WebSocketDisconnect or similar
        with client.websocket_connect("/swarm/ws") as websocket:
            pass
