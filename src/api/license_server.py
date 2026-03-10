"""
Remote License Validation API Server — ROIaaS Phase 2

FastAPI server for license validation with rate limiting.
Runs on port 8787.
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
from typing import Optional, Dict
import json
from pathlib import Path

from src.lib.license_generator import validate_license, get_tier_limits
from src.lib.usage_meter import UsageMeter

app = FastAPI(title="RaaS License API", version="2.0.0")
security = HTTPBearer(auto_error=False)

# Rate limiting storage
_rate_limits: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100  # per window


class ValidateRequest(BaseModel):
    license_key: str


class ValidateResponse(BaseModel):
    valid: bool
    tier: Optional[str] = None
    key_id: Optional[str] = None
    daily_limit: Optional[int] = None
    error: Optional[str] = None


def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit."""
    now = datetime.utcnow().timestamp()
    window_start = now - RATE_LIMIT_WINDOW

    if client_ip not in _rate_limits:
        _rate_limits[client_ip] = []

    # Remove old requests
    _rate_limits[client_ip] = [
        ts for ts in _rate_limits[client_ip] if ts > window_start
    ]

    # Check limit
    if len(_rate_limits[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return False

    # Record request
    _rate_limits[client_ip].append(now)
    return True


def get_revoked_keys() -> set:
    """Get set of revoked key IDs."""
    revoked_path = Path.home() / ".mekong" / "revoked.json"
    if revoked_path.exists():
        with open(revoked_path, "r") as f:
            return set(json.load(f))
    return set()


@app.post("/api/v1/license/validate", response_model=ValidateResponse)
async def validate_license_endpoint(
    request: ValidateRequest,
    http_request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Validate a license key.

    Requires Bearer token for authentication (optional for local dev).
    Rate limited to 100 requests per minute per IP.
    """
    client_ip = http_request.client.host

    # Check rate limit
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # Optional: Check API token
    api_token = os.getenv("RAAS_API_TOKEN")
    if api_token and credentials:
        if credentials.credentials != api_token:
            raise HTTPException(status_code=401, detail="Invalid API token")

    # Validate license key
    is_valid, info, error = validate_license(request.license_key)

    if not is_valid:
        return ValidateResponse(valid=False, error=error)

    # Check revocation list
    key_id = info.get("key_id") if info else None
    revoked = get_revoked_keys()
    if key_id and key_id in revoked:
        return ValidateResponse(valid=False, error="License key has been revoked")

    # Get tier limits
    tier = info.get("tier") if info else None
    limits = get_tier_limits(tier) if tier else None
    daily_limit = limits["commands_per_day"] if limits else None

    return ValidateResponse(
        valid=True,
        tier=tier,
        key_id=key_id,
        daily_limit=daily_limit,
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/v1/license/stats")
async def get_stats():
    """Get license validation statistics."""
    return {
        "active_rate_limits": len(_rate_limits),
        "timestamp": datetime.utcnow().isoformat(),
    }


def start_server(host: str = "0.0.0.0", port: int = 8787) -> None:
    """Start the license validation server."""
    print(f"🚀 Starting RaaS License API on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    port = int(os.getenv("RAAS_API_PORT", "8787"))
    start_server(port=port)
