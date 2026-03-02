"""Tests for RaaS auth middleware — JWT decode, mk_ API key routing, error paths."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from unittest.mock import MagicMock

import pytest

from src.api.raas_auth_middleware import require_tenant, _verify_jwt_token


def _make_jwt(payload: dict, secret: str) -> str:
    """Create a valid HS256 JWT for testing."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).rstrip(b"=").decode()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signing_input = f"{header_b64}.{payload_b64}".encode()
    sig = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
    return f"{header_b64}.{payload_b64}.{sig_b64}"


class TestJWTVerification:
    """JWT token decode + signature verification."""

    SECRET = "test-secret-key-256bit"

    def test_valid_jwt_returns_tenant_context(self) -> None:
        token = _make_jwt(
            {"sub": "tenant-123", "tenant_name": "Acme Corp", "exp": time.time() + 3600},
            self.SECRET,
        )
        ctx = _verify_jwt_token(token, self.SECRET)
        assert ctx.tenant_id == "tenant-123"
        assert ctx.tenant_name == "Acme Corp"

    def test_expired_jwt_raises_401(self) -> None:
        token = _make_jwt(
            {"sub": "tenant-123", "exp": time.time() - 100},
            self.SECRET,
        )
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            _verify_jwt_token(token, self.SECRET)
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    def test_wrong_secret_raises_401(self) -> None:
        token = _make_jwt({"sub": "t1", "exp": time.time() + 3600}, "correct-secret")
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            _verify_jwt_token(token, "wrong-secret")
        assert exc_info.value.status_code == 401

    def test_missing_sub_claim_raises_401(self) -> None:
        token = _make_jwt({"name": "no-sub", "exp": time.time() + 3600}, self.SECRET)
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            _verify_jwt_token(token, self.SECRET)
        assert exc_info.value.status_code == 401
        assert "sub" in exc_info.value.detail.lower()

    def test_malformed_jwt_raises_401(self) -> None:
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            _verify_jwt_token("not.a.valid.jwt.token", self.SECRET)
        assert exc_info.value.status_code == 401


class TestRequireTenantMiddleware:
    """require_tenant FastAPI dependency — header validation."""

    def _make_request(self, auth_header: str | None = None) -> MagicMock:
        headers: dict[str, str] = {}
        if auth_header is not None:
            headers["Authorization"] = auth_header
        req = MagicMock()
        req.headers = MagicMock(wraps=headers)
        req.headers.get = headers.get
        req.headers.__contains__ = headers.__contains__
        req.headers.__getitem__ = headers.__getitem__
        return req

    def test_missing_auth_header_raises_401(self) -> None:
        req = self._make_request(auth_header=None)
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            require_tenant(req)
        assert exc_info.value.status_code == 401
        assert "Missing" in exc_info.value.detail

    def test_non_bearer_prefix_raises_401(self) -> None:
        req = self._make_request(auth_header="Basic abc123")
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            require_tenant(req)
        assert exc_info.value.status_code == 401
        assert "Malformed" in exc_info.value.detail

    def test_invalid_token_format_raises_401(self) -> None:
        # Not mk_ prefix, no JWT secret configured
        old_val = os.environ.pop("RAAS_JWT_SECRET", None)
        try:
            req = self._make_request(auth_header="Bearer random-token-no-mk")
            from fastapi import HTTPException
            with pytest.raises(HTTPException) as exc_info:
                require_tenant(req)
            assert exc_info.value.status_code == 401
        finally:
            if old_val is not None:
                os.environ["RAAS_JWT_SECRET"] = old_val

    def test_jwt_path_with_secret_configured(self) -> None:
        secret = "jwt-test-secret"
        os.environ["RAAS_JWT_SECRET"] = secret
        try:
            token = _make_jwt(
                {"sub": "jwt-tenant", "exp": time.time() + 3600},
                secret,
            )
            req = self._make_request(auth_header=f"Bearer {token}")
            ctx = require_tenant(req)
            assert ctx.tenant_id == "jwt-tenant"
        finally:
            del os.environ["RAAS_JWT_SECRET"]
