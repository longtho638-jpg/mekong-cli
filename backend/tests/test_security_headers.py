import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from backend.middleware.security_headers import SecurityHeadersMiddleware


@pytest.mark.asyncio
async def test_security_headers_middleware():
    app = FastAPI()
    app.add_middleware(SecurityHeadersMiddleware)

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")

    assert response.status_code == 200
    headers = response.headers

    # Check for presence of security headers
    assert "content-security-policy" in headers
    assert "strict-transport-security" in headers
    assert "x-content-type-options" in headers
    assert "x-frame-options" in headers
    assert "referrer-policy" in headers
    assert "permissions-policy" in headers
    assert "x-xss-protection" in headers

    # Verify specific values (hardening)
    assert headers["x-frame-options"] == "DENY"
    assert headers["x-content-type-options"] == "nosniff"
    assert "max-age=31536000" in headers["strict-transport-security"]
    assert "default-src 'self'" in headers["content-security-policy"]
