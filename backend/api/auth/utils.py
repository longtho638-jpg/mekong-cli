import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from backend.api.config import settings
from backend.services.jwt_service import jwt_service

# Configuration
SECRET_KEY = settings.secret_key
ALGORITHM = settings.jwt_algorithm

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", truncate_error=False)


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with expiration."""
    # Adapter to use the robust JWTService
    # data usually contains 'sub' and 'role' from legacy code
    user_id = data.get("sub")
    # We might need to handle other claims if they exist, but for now we map what we can
    scope = data.get("scope", "read")
    role = data.get("role", "user")  # Not standard in simple create_access_token but good to keep

    # Note: jwt_service.create_access_token returns (token, jti, expire)
    # But legacy expects just token string.
    # We also need to preserve the custom claims 'role' if possible,
    # but JWTService uses a fixed schema JWTPayload.
    # To avoid breaking changes, we might need to extend JWTPayload or just use JWTService for core mechanics.
    # However, strict rotation requires JTI which JWTService adds.

    # Let's use JWTService but we might lose 'role' in the top level if we aren't careful.
    # JWTPayload doesn't have 'role'. It has 'scope'.
    # We should probably map role to scope or just rely on DB lookup for role in dependencies.
    # But for backward compatibility with the "fake_users_db" which relies on token claims:

    # Let's implement this by using JWTService logic but manually adding the extra claims if needed,
    # OR we assume JWTService is the source of truth and update dependencies.
    # Given the instructions "JWT rotation", we MUST use JWTService.

    token, _, _ = jwt_service.create_access_token(
        user_id=user_id,
        client_id="legacy_auth",
        scope=f"{scope} role:{role}",  # Embedding role in scope is a common pattern
        expires_delta=expires_delta,
    )
    return token


async def verify_token(token: str, credentials_exception) -> TokenData:
    """Verify and decode a JWT token."""
    try:
        # Use JWTService to decode (handles blacklist check)
        payload = await jwt_service.decode_token(token)
        if payload is None:
            raise credentials_exception

        username: str = payload.get("sub")

        # Extract role from scope if we put it there
        scopes = payload.get("scope", "").split(" ")
        role = "user"
        for s in scopes:
            if s.startswith("role:"):
                role = s.split(":")[1]
                break

        if username is None:
            raise credentials_exception

        token_data = TokenData(username=username, role=role)
        return token_data
    except JWTError:
        raise credentials_exception
