from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.auth.router import router
from backend.api.config import settings

# Setup a test app including the router
app = FastAPI()
app.include_router(router)

client = TestClient(app)


@pytest.fixture
def mock_captcha_service():
    with patch("backend.api.auth.router.captcha_service") as mock:
        mock.verify_token = AsyncMock()
        yield mock


@pytest.fixture
def mock_settings_captcha_enabled():
    # Patch the settings object instance directly where it's used
    with patch.object(settings, "enable_captcha_login", True):
        yield


@pytest.fixture
def mock_settings_captcha_disabled():
    with patch.object(settings, "enable_captcha_login", False):
        yield


def test_login_captcha_disabled_success(mock_settings_captcha_disabled, mock_captcha_service):
    """Test login works without CAPTCHA when feature flag is off"""
    response = client.post(
        "/token",
        data={"username": "user", "password": "password"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    # Verify service was NOT called
    mock_captcha_service.verify_token.assert_not_called()


def test_login_captcha_enabled_missing_header(mock_settings_captcha_enabled, mock_captcha_service):
    """Test login fails when CAPTCHA is enabled but header is missing"""
    response = client.post(
        "/token",
        data={"username": "user", "password": "password"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "CAPTCHA token required"


def test_login_captcha_enabled_invalid_token(mock_settings_captcha_enabled, mock_captcha_service):
    """Test login fails when CAPTCHA token is invalid"""
    mock_captcha_service.verify_token.return_value = False

    response = client.post(
        "/token",
        data={"username": "user", "password": "password"},
        headers={"X-Captcha-Token": "invalid-token"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid CAPTCHA token"

    mock_captcha_service.verify_token.assert_awaited_once_with("invalid-token")


def test_login_captcha_enabled_valid_token(mock_settings_captcha_enabled, mock_captcha_service):
    """Test login succeeds when CAPTCHA token is valid"""
    mock_captcha_service.verify_token.return_value = True

    response = client.post(
        "/token",
        data={"username": "user", "password": "password"},
        headers={"X-Captcha-Token": "valid-token"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

    mock_captcha_service.verify_token.assert_awaited_once_with("valid-token")
