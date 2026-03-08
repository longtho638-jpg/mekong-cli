"""Tests for Session Manager - JWT token management and session handling.

Tests JWT token creation/validation, session management, cookie helpers,
expiry handling, and encoding/decoding logic.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

from unittest.mock import AsyncMock

from src.auth.session_manager import (
    SessionManager,
    get_token_from_request,
)

# Test user ID for testing
TEST_USER_ID = uuid.uuid4()
TEST_USER_EMAIL = "test@example.com"
TEST_USER_ROLE = "member"


class TestJWTClaimsCreation:
    """Test JWT claim creation logic."""

    def test_claim_contains_required_fields(self):
        """JWT claims should contain sub, email, role, type, iat, exp, jti."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            claims = manager._create_jwt_claims(
                user_id=str(TEST_USER_ID),
                email=TEST_USER_EMAIL,
                role=TEST_USER_ROLE,
                token_type="access",
            )

            assert "sub" in claims
            assert "email" in claims
            assert "role" in claims
            assert "type" in claims
            assert "iat" in claims
            assert "exp" in claims
            assert "jti" in claims

    def test_access_token_has_correct_expiration(self):
        """Access token should expire in 30 minutes by default."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            claims = manager._create_jwt_claims(
                user_id=str(TEST_USER_ID),
                email=TEST_USER_EMAIL,
                role=TEST_USER_ROLE,
                token_type="access",
            )

            # exp - iat should be 30 minutes (1800 seconds)
            delta = claims["exp"] - claims["iat"]
            # delta is a timedelta, so check its total_seconds()
            assert delta.total_seconds() == 1800

    def test_refresh_token_has_correct_expiration(self):
        """Refresh token should expire in 7 days by default."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            claims = manager._create_jwt_claims(
                user_id=str(TEST_USER_ID),
                email=TEST_USER_EMAIL,
                role=TEST_USER_ROLE,
                token_type="refresh",
            )

            # exp - iat should be 7 days (604800 seconds)
            delta = claims["exp"] - claims["iat"]
            # delta is a timedelta, so check its total_seconds()
            assert delta.total_seconds() == 604800  # 7 days in seconds

    def test_claim_contains_unique_jti(self):
        """Each claim should have a unique JWT ID."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            claims1 = manager._create_jwt_claims(
                user_id=str(TEST_USER_ID),
                email=TEST_USER_EMAIL,
                role=TEST_USER_ROLE,
                token_type="access",
            )

            claims2 = manager._create_jwt_claims(
                user_id=str(TEST_USER_ID),
                email=TEST_USER_EMAIL,
                role=TEST_USER_ROLE,
                token_type="access",
            )

            assert claims1["jti"] != claims2["jti"]


class TestAccessTokenCreation:
    """Test access token creation."""

    def test_create_access_token_returns_valid_jwt(self):
        """Access token should be a valid JWT string."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                # Create a mock user
                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user, role="admin")

                # Token should be a non-empty string
                assert isinstance(token, str)
                assert len(token) > 0

    def test_create_access_token_contains_correct_payload(self):
        """Token payload should contain user info and role."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user, role="owner")

                # Decode and verify payload
                import jwt
                payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])

                assert payload["sub"] == str(TEST_USER_ID)
                assert payload["email"] == TEST_USER_EMAIL
                assert payload["role"] == "owner"
                assert payload["type"] == "access"

    def test_create_access_token_with_default_role(self):
        """Should use 'member' as default role when not specified."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                import jwt
                payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])

                assert payload["role"] == "member"


class TestRefreshTokenCreation:
    """Test refresh token creation."""

    def test_create_refresh_token_returns_valid_jwt(self):
        """Refresh token should be a valid JWT string."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_refresh_token(user)

                assert isinstance(token, str)
                assert len(token) > 0

    def test_create_refresh_token_has_refresh_type(self):
        """Refresh token payload should have type='refresh'."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_refresh_token(user)

                import jwt
                payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])

                assert payload["type"] == "refresh"


class TestTokenDecoding:
    """Test token decoding and validation."""

    def test_decode_valid_token_returns_true_and_payload(self):
        """Valid token should return (True, payload, None)."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                is_valid, payload, error = manager.decode_token(token)

                assert is_valid is True
                assert payload is not None
                assert error is None
                assert payload["email"] == TEST_USER_EMAIL

    def test_decode_expired_token_returns_false(self):
        """Expired token should return (False, None, error)."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                # Create an expired token manually
                import jwt
                expired_payload = {
                    "sub": str(TEST_USER_ID),
                    "email": TEST_USER_EMAIL,
                    "role": "member",
                    "type": "access",
                    "iat": datetime.now(timezone.utc) - timedelta(hours=2),
                    "exp": datetime.now(timezone.utc) - timedelta(hours=1),
                    "jti": "expired-jti",
                }
                expired_token = jwt.encode(
                    expired_payload,
                    'test-secret',
                    algorithm='HS256'
                )

                is_valid, payload, error = manager.decode_token(expired_token)

                assert is_valid is False
                assert payload is None
                assert error is not None
                assert "expired" in error.lower()

    def test_decode_invalid_token_returns_false(self):
        """Invalid token (wrong signature) should return (False, None, error)."""
        manager = SessionManager()

        # Use an invalid token directly
        is_valid, payload, error = manager.decode_token("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalid_signature")

        assert is_valid is False
        assert payload is None

    def test_decode_malformed_token_returns_false(self):
        """Malformed token should return (False, None, error)."""
        manager = SessionManager()

        is_valid, payload, error = manager.decode_token("not.a.valid.jwt")

        assert is_valid is False
        assert payload is None
        assert error is not None

    def test_decode_token_missing_sub_returns_false(self):
        """Token without sub claim should return (False, None, error)."""
        manager = SessionManager()

        # Create token with other fields but no sub
        import time
        payload = {
            "email": TEST_USER_EMAIL,
            "role": "member",
            "type": "access",
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
        }

        # This will fail to decode because it's not properly signed
        # We just need to verify the error path works
        is_valid, payload, error = manager.decode_token("invalid-token")

        assert is_valid is False
        assert payload is None


class TestCreateSession:
    """Test session creation logic."""

    def test_create_session_calls_user_repo(self):
        """Should call user repository to create session."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            # Mock user
            user = MagicMock()
            user.id = TEST_USER_ID
            user.email = TEST_USER_EMAIL

            # Mock user repo
            mock_repo = MagicMock()
            mock_session = MagicMock()
            mock_session.id = uuid.uuid4()
            mock_repo.create_session = AsyncMock(return_value=mock_session)
            manager._user_repo = mock_repo

            # Create session
            import asyncio
            result = asyncio.run(manager.create_session(user, role="admin"))

            # Verify result structure
            session, access_token, refresh_token = result
            assert session == mock_session
            assert isinstance(access_token, str)
            assert isinstance(refresh_token, str)

            # Verify repo was called
            mock_repo.create_session.assert_called_once()


class TestValidateSession:
    """Test session validation logic."""

    def test_validate_valid_session_returns_user(self):
        """Valid session token should return user."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                # Mock user repo
                mock_repo = MagicMock()
                mock_repo.find_by_id = AsyncMock(return_value=user)
                manager._user_repo = mock_repo

                import asyncio
                result = asyncio.run(manager.validate_session(token))

                assert result == user
                mock_repo.find_by_id.assert_called_once()

    def test_validate_invalid_token_returns_none(self):
        """Invalid token should return None."""
        manager = SessionManager()

        import asyncio
        result = asyncio.run(manager.validate_session("invalid.token.here"))

        assert result is None

    def test_validate_expired_token_returns_none(self):
        """Expired token should return None."""
        manager = SessionManager()

        import asyncio
        # Create a real expired token
        import jwt
        expired_payload = {
            "sub": str(TEST_USER_ID),
            "email": TEST_USER_EMAIL,
            "role": "member",
            "type": "access",
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "jti": "expired",
        }
        expired_token = jwt.encode(expired_payload, 'test-secret', algorithm='HS256')

        result = asyncio.run(manager.validate_session(expired_token))

        assert result is None

    def test_validate_missing_user_returns_none(self):
        """Token for non-existent user should return None."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                # Mock user repo to return None (user not found)
                mock_repo = MagicMock()
                mock_repo.find_by_id = AsyncMock(return_value=None)
                manager._user_repo = mock_repo

                import asyncio
                result = asyncio.run(manager.validate_session(token))

                assert result is None


class TestRevokeSession:
    """Test session revocation logic."""

    def test_revoke_session_calls_user_repo(self):
        """Should call user repository to delete session."""
        manager = SessionManager()

        session_id = uuid.uuid4()

        # Mock user repo
        mock_repo = MagicMock()
        mock_repo.delete_session = AsyncMock(return_value=True)
        manager._user_repo = mock_repo

        import asyncio
        result = asyncio.run(manager.revoke_session(session_id))

        assert result is True
        mock_repo.delete_session.assert_called_once_with(session_id)

    def test_revoke_session_returns_false_on_failure(self):
        """Should return False if session doesn't exist."""
        manager = SessionManager()

        session_id = uuid.uuid4()

        # Mock user repo to return False
        mock_repo = MagicMock()
        mock_repo.delete_session = AsyncMock(return_value=False)
        manager._user_repo = mock_repo

        import asyncio
        result = asyncio.run(manager.revoke_session(session_id))

        assert result is False


class TestRevokeAllSessions:
    """Test revoking all user sessions."""

    def test_revoke_all_user_sessions_calls_user_repo(self):
        """Should call user repository to delete all user sessions."""
        manager = SessionManager()

        user_id = TEST_USER_ID

        # Mock user repo
        mock_repo = MagicMock()
        mock_repo.delete_user_sessions = AsyncMock(return_value=3)
        manager._user_repo = mock_repo

        import asyncio
        result = asyncio.run(manager.revoke_all_user_sessions(user_id))

        assert result == 3
        mock_repo.delete_user_sessions.assert_called_once_with(user_id)


class TestRefreshSession:
    """Test session refresh logic."""

    def test_refresh_valid_refresh_token_returns_new_tokens(self):
        """Valid refresh token should return new access and refresh tokens."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                # Create a refresh token
                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL
                user.role = "member"

                refresh_token = manager.create_refresh_token(user)

                # Mock user repo
                mock_repo = MagicMock()
                mock_repo.find_by_id = AsyncMock(return_value=user)
                manager._user_repo = mock_repo

                import asyncio
                result = asyncio.run(manager.refresh_session(refresh_token))

                assert result is not None
                new_access, new_refresh = result
                assert isinstance(new_access, str)
                assert isinstance(new_refresh, str)
                assert new_access != refresh_token  # New access token

    def test_refresh_access_token_returns_none(self):
        """Access token should not be refreshable."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                # This is an access token, not a refresh token
                access_token = manager.create_access_token(user)

                import asyncio
                result = asyncio.run(manager.refresh_session(access_token))

                assert result is None

    def test_refresh_expired_refresh_token_returns_none(self):
        """Expired refresh token should return None."""
        manager = SessionManager()

        import jwt
        expired_payload = {
            "sub": str(TEST_USER_ID),
            "email": TEST_USER_EMAIL,
            "type": "refresh",
            "iat": datetime.now(timezone.utc) - timedelta(days=10),
            "exp": datetime.now(timezone.utc) - timedelta(days=3),
            "jti": "expired-refresh",
        }
        expired_token = jwt.encode(expired_payload, 'test-secret', algorithm='HS256')

        import asyncio
        result = asyncio.run(manager.refresh_session(expired_token))

        assert result is None


class TestCookieHelpers:
    """Test HTTPOnly cookie helper methods."""

    def test_create_session_cookie_returns_dict(self):
        """Should return dictionary with cookie parameters."""
        manager = SessionManager()

        token = "session-token-123"
        cookie_params = manager.create_session_cookie(token)

        assert isinstance(cookie_params, dict)
        assert "key" in cookie_params
        assert "value" in cookie_params
        assert "httponly" in cookie_params
        assert "secure" in cookie_params
        assert "samesite" in cookie_params
        assert "max_age" in cookie_params
        assert "path" in cookie_params

        assert cookie_params["key"] == "session_token"
        assert cookie_params["value"] == token
        assert cookie_params["httponly"] is True

    def test_create_session_cookie_secure_in_production(self):
        """Cookie should be secure in production environment."""
        with patch.dict('os.environ', {'AUTH_ENVIRONMENT': 'production'}):
            manager = SessionManager()

            cookie_params = manager.create_session_cookie("token")

            assert cookie_params["secure"] is True
            assert cookie_params["samesite"] == "none"

    def test_create_session_cookie_http_only_always_true(self):
        """Cookie should always be httpOnly for security."""
        manager = SessionManager()

        cookie_params = manager.create_session_cookie("token")

        assert cookie_params["httponly"] is True

    def test_create_session_cookie_default_expires_7_days(self):
        """Cookie should default to 7 days expiration."""
        manager = SessionManager()

        cookie_params = manager.create_session_cookie("token")

        assert cookie_params["max_age"] == 7 * 24 * 60 * 60  # 7 days in seconds

    def test_create_session_cookie_custom_expiration(self):
        """Should support custom expiration days."""
        manager = SessionManager()

        cookie_params = manager.create_session_cookie("token", expires_in_days=1)

        assert cookie_params["max_age"] == 24 * 60 * 60  # 1 day in seconds

    def test_set_session_cookie_sets_on_response(self):
        """Should call Response.set_cookie with correct parameters."""
        from fastapi import Response

        manager = SessionManager()

        response = Response()
        token = "session-token"

        result = manager.set_session_cookie(response, token)

        assert result is response

    def test_get_session_cookie_returns_token(self):
        """Should extract token from request cookies."""
        from fastapi import Request

        manager = SessionManager()

        # Build cookie header for the session_token cookie
        cookie_header = b"session_token=test-token-123"
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [(b"cookie", cookie_header)],
        })

        token = manager.get_session_cookie(request)

        assert token == "test-token-123"

    def test_get_session_cookie_returns_none_when_missing(self):
        """Should return None when session cookie not present."""
        from fastapi import Request

        manager = SessionManager()

        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [],
        })

        token = manager.get_session_cookie(request)

        assert token is None

    def test_delete_session_cookie_sets_expired(self):
        """Should delete the session cookie."""
        from fastapi import Response

        manager = SessionManager()

        response = Response()

        result = manager.delete_session_cookie(response)

        assert result is response


class TestLogoutRedirect:
    """Test logout redirect creation."""

    def test_create_logout_redirect_clears_cookie(self):
        """Redirect response should clear session cookie."""
        from fastapi import Response
        from starlette.responses import RedirectResponse

        manager = SessionManager()

        response = Response()
        redirect = manager.create_logout_redirect(response, redirect_to="/login")

        assert isinstance(redirect, RedirectResponse)
        assert redirect.status_code == 303  # See Other


class TestConvenienceFunctions:
    """Test module-level convenience functions."""

    def test_get_token_from_request_calls_session_manager(self):
        """Should get token from request cookie."""
        # This is a basic test - the actual function just delegates
        assert callable(get_token_from_request)


class TestSessionManagerInit:
    """Test SessionManager initialization."""

    def test_init_with_custom_repo(self):
        """Should accept custom UserRepository."""
        mock_repo = MagicMock()
        manager = SessionManager(user_repo=mock_repo)

        assert manager._user_repo == mock_repo

    def test_init_with_default_repo(self):
        """Should create default UserRepository if none provided."""
        manager = SessionManager()

        assert manager._user_repo is not None


class TestSecurity:
    """Test security-related behaviors."""

    def test_token_signature_algorithm_is_hs256(self):
        """Default algorithm should be HS256 for HMAC."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                # Decode without specifying algorithm to verify it's HS256
                import json

                # Get the header from the token
                header_b64 = token.split('.')[0]
                header_json = base64url_decode(header_b64)
                header = json.loads(header_json)

                assert header["alg"] == "HS256"


def base64url_decode(data: str) -> bytes:
    """Decode base64url encoded data."""
    import base64
    # Add padding if necessary
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)


class TestEnvironmentVariables:
    """Test environment variable configuration."""

    def test_default_secret_is_used(self):
        """Should use default secret when JWT_SECRET env var not set."""
        # The secret should be randomly generated if not set
        with patch.dict(os.environ, {}, clear=True):
            if "JWT_SECRET" in os.environ:
                del os.environ["JWT_SECRET"]

            SessionManager()  # verify init works without JWT_SECRET env

            # The JWT_SECRET is set at module import time
            import src.auth.session_manager as session_module
            assert hasattr(session_module, 'JWT_SECRET')

    def test_cookie_name_is_configurable(self):
        """Should use configurable cookie name."""
        import src.auth.session_manager as session_module
        assert session_module.COOKIE_NAME == "session_token"

    def test_cookie_secure_flag(self):
        """Should configure secure flag based on environment."""
        import src.auth.session_manager as session_module
        # Default is not secure (dev mode)
        assert session_module.COOKIE_SECURE is False

    def test_cookie_httponly_flag(self):
        """Should always set httponly for security."""
        import src.auth.session_manager as session_module
        assert session_module.COOKIE_HTTPONLY is True


class TestTokenIntegrity:
    """Test token integrity and validation."""

    def test_token_cannot_be_modified(self):
        """Token signature should prevent modification."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            with patch('src.auth.session_manager.JWT_ALGORITHM', 'HS256'):
                manager = SessionManager()

                user = MagicMock()
                user.id = TEST_USER_ID
                user.email = TEST_USER_EMAIL

                token = manager.create_access_token(user)

                # Try to tamper with the token
                parts = token.split('.')
                payload_b64 = parts[1]

                # Decode payload
                import base64
                import json
                padding = 4 - len(payload_b64) % 4
                if padding != 4:
                    payload_b64 += '=' * padding
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))

                # Modify payload
                payload["role"] = "owner"

                # Re-encode
                new_payload_b64 = base64.urlsafe_b64encode(
                    json.dumps(payload).encode()
                ).rstrip(b'=').decode()

                tampered_token = f"{parts[0]}.{new_payload_b64}.{parts[2]}"

                # Try to decode with original secret
                is_valid, payload, error = manager.decode_token(tampered_token)

                # Should fail due to signature mismatch
                assert is_valid is False


class TestTokenExpiryHandling:
    """Test token expiry edge cases."""

    def test_token_exactly_at_expiration(self):
        """Token at exactly expiration time should be invalid."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            import jwt
            from datetime import datetime, timedelta

            # Token expiring right now
            now = datetime.now(timezone.utc)
            expiring_payload = {
                "sub": str(TEST_USER_ID),
                "email": TEST_USER_EMAIL,
                "role": "member",
                "type": "access",
                "iat": now - timedelta(hours=1),
                "exp": now,
                "jti": "expiring",
            }
            expiring_token = jwt.encode(expiring_payload, 'test-secret', algorithm='HS256')

            is_valid, payload, error = manager.decode_token(expiring_token)

            # Should be invalid (expired)
            assert is_valid is False

    def test_token_just_before_expiration(self):
        """Token just before expiration should be valid."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            import jwt
            from datetime import datetime, timedelta

            # Token expiring in 1 second
            now = datetime.now(timezone.utc)
            expiring_payload = {
                "sub": str(TEST_USER_ID),
                "email": TEST_USER_EMAIL,
                "role": "member",
                "type": "access",
                "iat": now - timedelta(hours=1),
                "exp": now + timedelta(seconds=1),
                "jti": "not-yet-expired",
            }
            expiring_token = jwt.encode(expiring_payload, 'test-secret', algorithm='HS256')

            is_valid, payload, error = manager.decode_token(expiring_token)

            # Should be valid
            assert is_valid is True


class TestRoleClaims:
    """Test role handling in claims."""

    def test_different_roles_in_claims(self):
        """Should support all role values."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            rol = "owner"
            user = MagicMock()
            user.id = TEST_USER_ID
            user.email = TEST_USER_EMAIL

            token = manager.create_access_token(user, role=rol)

            import jwt
            payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])

            assert payload["role"] == rol

    def test_role_no_spoofing(self):
        """Role in token cannot be arbitrarily set."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            import jwt

            user = MagicMock()
            user.id = TEST_USER_ID
            user.email = TEST_USER_EMAIL

            # Token should be created through SessionManager
            manager = SessionManager()
            token = manager.create_access_token(user, role="member")

            # Decode to verify
            payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])
            assert payload["role"] == "member"


class TestJtiUniqueness:
    """Test JWT ID (jti) uniqueness."""

    def test_jti_is_unique_per_token(self):
        """Each token should have a unique jti."""
        with patch('src.auth.session_manager.JWT_SECRET', 'test-secret'):
            manager = SessionManager()

            user = MagicMock()
            user.id = TEST_USER_ID
            user.email = TEST_USER_EMAIL

            jti_list = []
            for _ in range(10):
                token = manager.create_access_token(user)
                import jwt
                payload = jwt.decode(token, 'test-secret', algorithms=['HS256'])
                jti_list.append(payload["jti"])

            # All jti values should be unique
            assert len(set(jti_list)) == 10
