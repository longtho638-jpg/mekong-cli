from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.api.schemas.oauth import OAuthClientCreate
from backend.db.base import Base
from backend.models.oauth import OAuthClient, OAuthGrant, OAuthToken
from backend.services.jwt_service import JWTService
from backend.services.oauth_service import OAuthService
from backend.services.token_service import TokenService

# Test Config
TEST_SECRET_KEY = "test-secret-key"
TEST_ISSUER = "test-issuer"


@pytest.fixture(scope="session")
def engine():
    return create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})


@pytest.fixture(scope="session")
def tables(engine):
    # Only create OAuth tables to avoid Foreign Key errors with missing User table
    # in other models that might be registered in Base
    target_tables = [OAuthClient.__table__, OAuthGrant.__table__, OAuthToken.__table__]
    Base.metadata.create_all(engine, tables=target_tables)
    yield
    Base.metadata.drop_all(engine, tables=target_tables)


@pytest.fixture
def db_session(engine, tables):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def jwt_service(monkeypatch):
    """Mock settings for JWTService"""

    class MockSettings:
        secret_key = TEST_SECRET_KEY
        jwt_algorithm = "HS256"
        access_token_expire_minutes = 60
        refresh_token_expire_minutes = 10080
        backend_url = TEST_ISSUER

    monkeypatch.setattr("backend.services.jwt_service.settings", MockSettings())
    return JWTService()


@pytest.fixture
def oauth_service(db_session: Session):
    return OAuthService(db_session)


@pytest.fixture
def token_service(db_session: Session):
    return TokenService(db_session)


@pytest.mark.asyncio
async def test_jwt_generation_validation(jwt_service):
    """Test JWT creation and decoding"""
    user_id = "user_123"
    client_id = "client_abc"
    scope = "read write"

    encoded, jti, expiry = jwt_service.create_access_token(user_id, client_id, scope)

    assert encoded is not None
    assert jti is not None
    assert expiry > datetime.now(timezone.utc)

    # Mock Redis for jwt_service inside test if needed, or if fixture didn't handle it
    # But jwt_service fixture calls JWTService() which uses real redis_client from imports unless mocked.
    # We should mock redis in the jwt_service fixture or here.

    # In integration test we used a mock. Here jwt_service fixture uses mocked settings but REAL redis_client import?
    # backend.services.jwt_service imports redis_client from backend.core.infrastructure.redis
    # We should patch that too.

    from unittest.mock import AsyncMock

    jwt_service.redis = AsyncMock()
    jwt_service.redis.exists.return_value = 0

    # Decode
    payload = await jwt_service.decode_token(encoded)
    assert payload["sub"] == user_id
    assert payload["aud"] == client_id
    assert payload["scope"] == scope
    assert payload["iss"] == TEST_ISSUER
    assert payload["jti"] == jti


def test_client_registration(oauth_service):
    """Test OAuth client registration"""
    client_data = OAuthClientCreate(
        client_name="Test App",
        redirect_uris=["http://localhost/cb"],
        grant_types=["authorization_code"],
        scopes=["read"],
        is_confidential=True,
    )

    client, secret = oauth_service.register_client(client_data)

    assert client.client_id is not None
    assert client.client_name == "Test App"
    assert client.redirect_uris == ["http://localhost/cb"]
    # Secret should be plain string returned
    assert len(secret) > 20
    # Hash should be stored
    assert client.client_secret_hash != secret
    assert len(client.client_secret_hash) == 64  # SHA256 hex digest length


def test_authenticate_client(oauth_service):
    """Test client authentication"""
    client_data = OAuthClientCreate(client_name="Test App", redirect_uris=["http://localhost/cb"])
    client, secret = oauth_service.register_client(client_data)

    # Valid
    auth_client = oauth_service.authenticate_client(client.client_id, secret)
    assert auth_client is not None
    assert auth_client.client_id == client.client_id

    # Invalid Secret
    auth_client = oauth_service.authenticate_client(client.client_id, "wrong-secret")
    assert auth_client is None

    # Invalid ID
    auth_client = oauth_service.authenticate_client("wrong-id", secret)
    assert auth_client is None


def test_authorization_code_flow(oauth_service, token_service):
    """Test full authorization code flow"""
    # 1. Register Client
    client_data = OAuthClientCreate(
        client_name="Test App", redirect_uris=["http://localhost/cb"], scopes=["read"]
    )
    client, _ = oauth_service.register_client(client_data)

    # 2. Create Auth Code
    user_id = "user_1"
    code_verifier = "a" * 43  # Min length 43 for PKCE
    import base64
    import hashlib

    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

    code = oauth_service.create_authorization_code(
        client_id=client.client_id,
        user_id=user_id,
        redirect_uri="http://localhost/cb",
        code_challenge=code_challenge,
        code_challenge_method="S256",
        scopes=["read"],
    )
    assert code is not None

    # 3. Exchange Code
    access_token, refresh_token, expires_in = oauth_service.exchange_authorization_code(
        code=code,
        redirect_uri="http://localhost/cb",
        code_verifier=code_verifier,
        client_id=client.client_id,
    )

    assert access_token is not None
    assert refresh_token is not None
    assert expires_in > 0

    # 4. Verify Tokens in DB
    db_token = token_service.get_token_by_refresh_token(refresh_token)
    assert db_token is not None
    assert db_token.user_id == user_id
    assert db_token.client_id == client.client_id

    # 5. Reuse code should fail
    try:
        oauth_service.exchange_authorization_code(
            code=code,
            redirect_uri="http://localhost/cb",
            code_verifier=code_verifier,
            client_id=client.client_id,
        )
        assert False, "Should fail on reused code"
    except ValueError as e:
        assert str(e) == "Authorization code already used"


@pytest.mark.asyncio
async def test_refresh_token_rotation(token_service):
    """Test refresh token rotation"""
    # Mock settings again for JWT service inside token_service
    # Or rely on integration/conftest patching if available.
    # For now, let's assume default settings work or use Mock in real test suite.

    # Mock Redis
    from unittest.mock import AsyncMock

    token_service.jwt_service.redis = AsyncMock()
    token_service.jwt_service.redis.exists.return_value = 0
    token_service.jwt_service.redis.setex.return_value = True

    # Create initial tokens
    at, rt, exp = token_service.create_tokens("user_1", "client_1", "read")

    token_record = token_service.get_token_by_refresh_token(rt)
    assert token_record is not None
    assert token_record.revoked is False

    # Rotate
    new_at, new_rt, new_exp = await token_service.rotate_refresh_token(token_record)

    # Old should be revoked
    old_record = token_service.get_token_by_refresh_token(rt)
    assert old_record is None  # get_token filters out revoked

    # New should be valid
    new_record = token_service.get_token_by_refresh_token(new_rt)
    assert new_record is not None
    assert new_record.revoked is False
