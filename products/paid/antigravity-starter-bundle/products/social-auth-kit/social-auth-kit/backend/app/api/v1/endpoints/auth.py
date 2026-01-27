from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
import secrets

from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.token import RefreshToken
from app.providers import ProviderFactory
from app.services.user_service import UserService
from app.schemas.user import User as UserSchema
from app.schemas.token import Token

router = APIRouter()

@router.get("/login/{provider}")
async def login(provider: str, request: Request, response: Response):
    """
    Redirects the user to the OAuth provider's login page.
    Generates and stores a CSRF state token in an HTTP-only cookie.
    """
    redirect_uri = str(request.url_for("auth_callback", provider=provider))

    try:
        oauth_provider = ProviderFactory.get_provider(provider, redirect_uri)
    except ValueError:
        raise HTTPException(status_code=400, detail="Unknown provider")

    # Generate CSRF state token
    state = secrets.token_urlsafe(32)

    # Store state in secure, HTTP-only cookie (expires in 5 minutes)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=300,  # 5 minutes
        samesite="lax",
        secure=settings.MODE == "production"  # True in production, False in dev
    )

    return {"authorization_url": oauth_provider.get_auth_url(state)}


@router.get("/callback/{provider}", name="auth_callback")
async def auth_callback(
    provider: str,
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    oauth_state: Optional[str] = Cookie(None)
):
    """
    Handles the callback from the OAuth provider.
    Verifies CSRF state token before processing.
    """
    # Verify CSRF state token
    if not oauth_state or state != oauth_state:
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter. Possible CSRF attack."
        )

    redirect_uri = str(request.url_for("auth_callback", provider=provider))

    try:
        oauth_provider = ProviderFactory.get_provider(provider, redirect_uri)
        token = await oauth_provider.get_token(code)
        user_info = await oauth_provider.get_user_info(token)
    except Exception as e:
        # Clear state cookie on error
        response.delete_cookie("oauth_state")
        raise HTTPException(status_code=400, detail="OAuth authentication failed")

    # Delegate user creation/update to service
    user = await UserService.get_or_create_social_user(db, user_info)

    # Create Access Token
    access_token = create_access_token(subject=str(user.id))

    # Create Refresh Token
    refresh_token_str = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    refresh_token_db = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(refresh_token_db)
    await db.commit()

    # Clear state cookie (no longer needed)
    response.delete_cookie("oauth_state")

    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=settings.MODE == "production"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url
        }
    }

@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Rotates the refresh token and issues a new access token.
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    # Find token in DB
    result = await db.execute(select(RefreshToken).filter(RefreshToken.token == refresh_token))
    token_record = result.scalars().first()

    if not token_record:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check expiration
    if token_record.expires_at < datetime.utcnow():
        await db.delete(token_record)
        await db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # Rotate Token
    await db.delete(token_record)

    # Issue new refresh token
    new_refresh_token_str = secrets.token_urlsafe(64)
    new_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    new_token_record = RefreshToken(
        token=new_refresh_token_str,
        user_id=token_record.user_id,
        expires_at=new_expires_at
    )
    db.add(new_token_record)
    await db.commit()

    # Issue new access token
    access_token = create_access_token(subject=str(token_record.user_id))

    # Update Cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=settings.MODE == "production"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Revokes the refresh token and clears the cookie.
    """
    if refresh_token:
        result = await db.execute(select(RefreshToken).filter(RefreshToken.token == refresh_token))
        token_record = result.scalars().first()
        if token_record:
            await db.delete(token_record)
            await db.commit()

    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}
