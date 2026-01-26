import hashlib
import os
import time
import redis
import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from .models import ActivationRequest, ActivationResponse

app = FastAPI(title="Subscription Activation Server", version="1.0.0")

# Redis connection for persistent seat tracking
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# JWT secret (must be set in production)
SECRET_KEY = os.getenv("LICENSE_SECRET")
if not SECRET_KEY:
    raise ValueError("LICENSE_SECRET environment variable must be set")

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

def verify_checksum(key: str) -> bool:
    try:
        parts = key.split('-')
        if len(parts) != 4 or parts[0] != 'AGY':
            return False

        _, tenant, timestamp, checksum = parts

        # Recreate hash
        data = f"{tenant}|{timestamp}|{SECRET_KEY}"
        expected = hashlib.sha256(data.encode()).hexdigest()[:8]

        return checksum == expected
    except Exception:
        return False

@app.get("/")
def health_check():
    return {"status": "ok", "service": "activation-server"}

@app.post("/v1/activate", response_model=ActivationResponse)
def activate_license(request: ActivationRequest):
    # 1. Validate Format & Checksum
    if not verify_checksum(request.license_key):
        raise HTTPException(status_code=400, detail="Invalid license key or checksum")

    # 2. Check Expiry (Optional logic based on timestamp)
    # timestamp = int(request.license_key.split('-')[2])
    # ... expiry check ...

    # 3. Seat Management with Redis persistence
    seat_key = f"license:{request.license_key}:seats"
    current_seats = int(redis_client.get(seat_key) or 0)
    max_seats = 5  # Default limit for demo (should come from tier config)

    if current_seats >= max_seats:
        return ActivationResponse(
            success=False,
            message="Seat limit reached",
            seats_used=current_seats,
            seats_total=max_seats
        )

    # Allocate seat atomically
    new_seat_count = redis_client.incr(seat_key)

    # Set expiry on seat tracking (365 days)
    redis_client.expire(seat_key, 365 * 24 * 60 * 60)

    # Generate JWT access token
    expiry = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "license_key": request.license_key,
        "exp": expiry,
        "iat": datetime.utcnow(),
        "seats_used": new_seat_count
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

    return ActivationResponse(
        success=True,
        access_token=access_token,
        seats_used=new_seat_count,
        seats_total=max_seats
    )
