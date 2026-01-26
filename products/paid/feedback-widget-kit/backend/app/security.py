from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app import models
import secrets
import hashlib
from typing import Optional
from urllib.parse import urlparse

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(
    request: Request,
    api_key_header: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
):
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )

    # Hash the incoming key to compare with stored hash
    key_hash = hashlib.sha256(api_key_header.encode()).hexdigest()

    result = await db.execute(
        select(models.ApiKey).where(
            models.ApiKey.key_hash == key_hash,
            models.ApiKey.is_active == True
        )
    )
    api_key_record = result.scalar_one_or_none()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
        )

    # Validate Origin against Allowed Domains (if restricted)
    if api_key_record.allowed_domains:
        origin = request.headers.get("origin")
        allowed_list = api_key_record.allowed_domains if isinstance(api_key_record.allowed_domains, list) else []

        if allowed_list and "*" not in allowed_list:
            if not origin:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Origin header missing but required for this API Key"
                )

            # Normalize origin
            parsed_origin = urlparse(origin).netloc or origin

            is_allowed = False
            for allowed in allowed_list:
                if allowed == "*" or allowed == origin or allowed == parsed_origin:
                    is_allowed = True
                    break

            if not is_allowed:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Origin {origin} not allowed for this API Key"
                )

    return api_key_record

def generate_api_key() -> tuple[str, str]:
    """Generates a random API key and its hash."""
    # Generate a secure random key (32 bytes -> hex)
    raw_key = secrets.token_urlsafe(32)
    # Hash it for storage
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, key_hash
