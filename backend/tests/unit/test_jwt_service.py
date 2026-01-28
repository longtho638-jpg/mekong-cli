from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest

from backend.api.config import settings
from backend.services.jwt_service import JWTService


# Mock Redis
class MockRedis:
    def __init__(self):
        self.store = {}

    async def setex(self, key, seconds, value):
        self.store[key] = value

    async def exists(self, key):
        return 1 if key in self.store else 0

@pytest.fixture
def jwt_service_fixture():
    service = JWTService()
    service.redis = MockRedis()
    return service

@pytest.mark.asyncio
async def test_create_access_token(jwt_service_fixture):
    token, jti, expire = jwt_service_fixture.create_access_token(
        user_id="user123",
        client_id="client1",
        scope="read"
    )
    assert token is not None
    assert jti is not None

    # Decode
    payload = await jwt_service_fixture.decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"
    assert payload["scope"] == "read"
    assert payload["jti"] == jti

@pytest.mark.asyncio
async def test_token_expiration(jwt_service_fixture):
    # Create expired token
    token, _, _ = jwt_service_fixture.create_access_token(
        user_id="user123",
        client_id="client1",
        scope="read",
        expires_delta=timedelta(seconds=-1)
    )

    payload = await jwt_service_fixture.decode_token(token)
    assert payload is None  # Should fail exp check

@pytest.mark.asyncio
async def test_refresh_token(jwt_service_fixture):
    token, jti, expire = jwt_service_fixture.create_refresh_token(
        user_id="user123",
        client_id="client1",
        scope="read"
    )
    payload = await jwt_service_fixture.decode_token(token)
    assert payload["type"] == "refresh"

@pytest.mark.asyncio
async def test_revocation(jwt_service_fixture):
    token, jti, expire = jwt_service_fixture.create_access_token(
        user_id="user123",
        client_id="client1",
        scope="read"
    )

    # Verify valid
    assert await jwt_service_fixture.decode_token(token) is not None

    # Revoke
    await jwt_service_fixture.revoke_token(jti, 3600)

    # Verify blacklisted
    assert await jwt_service_fixture.is_token_blacklisted(jti) is True
    assert await jwt_service_fixture.decode_token(token) is None
