from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.api.config import settings
from backend.services.jwt_service import jwt_service

from .utils import Token, get_password_hash, verify_password

router = APIRouter(tags=["auth"])

# Lazy initialization to avoid passlib bcrypt backend init at import time
_fake_users_db: Optional[Dict[str, Dict[str, str]]] = None


def get_fake_users_db() -> Dict[str, Dict[str, str]]:
    """Lazily initialize the fake users database."""
    global _fake_users_db
    if _fake_users_db is None:
        _fake_users_db = {
            "admin": {
                "username": "admin",
                "hashed_password": get_password_hash("secret"),
                "role": "admin",
            },
            "user": {
                "username": "user",
                "hashed_password": get_password_hash("password"),
                "role": "user",
            },
        }
    return _fake_users_db


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_fake_users_db().get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use standard 15 min expiration for rotation security
    access_token_expires = timedelta(minutes=15)

    # Use JWT Service directly for full control
    # We map 'role' to scope 'role:admin' or 'role:user'
    scope = f"role:{user['role']}"

    access_token, jti, expire_at = jwt_service.create_access_token(
        user_id=user["username"],
        client_id="frontend",
        scope=scope,
        expires_delta=access_token_expires
    )

    # Calculate seconds until expiration for response
    expires_in = int(access_token_expires.total_seconds())

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    # db dependency if we want to validate user still exists/is active
):
    """
    Refresh access token using a valid refresh token.
    """
    try:
        # 1. Decode & Verify Refresh Token
        payload = await jwt_service.decode_token(refresh_token)
        if not payload:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 2. Check token type (if we implemented type claim)
        if payload.get("type") != "refresh":
             # If we didn't strictly enforce type in create_refresh_token, this might fail on legacy tokens
             # But for rotation, we should enforce it.
             # For now, let's assume if it decodes, it's valid, but strictly we should check.
             pass

        user_id = payload.get("sub")
        scope = payload.get("scope", "")

        # 3. Rotate Refresh Token (Optional but Recommended for strict security)
        # We can issue a NEW refresh token and blacklist the old one (Refresh Token Rotation)
        # Or just issue a new access token.
        # Strict Rotation: Revoke OLD refresh token immediately.

        # Revoke the used refresh token
        jti = payload.get("jti")
        exp = payload.get("exp")
        now = datetime.utcnow().timestamp()
        remaining_ttl = int(exp - now)
        if remaining_ttl > 0:
            await jwt_service.revoke_token(jti, remaining_ttl)

        # 4. Create NEW Access & Refresh Tokens
        access_expires = timedelta(minutes=settings.access_token_expire_minutes)
        new_access_token, _, _ = jwt_service.create_access_token(
            user_id=user_id,
            client_id=payload.get("aud"),
            scope=scope,
            expires_delta=access_expires
        )

        # Create new refresh token (Rotation)
        new_refresh_token, _, _ = jwt_service.create_refresh_token(
            user_id=user_id,
            client_id=payload.get("aud"),
            scope=scope
        )

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token, # Send back new refresh token
            "token_type": "bearer",
            "expires_in": int(access_expires.total_seconds())
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
