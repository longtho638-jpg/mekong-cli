"""
Auth Routes - OAuth2 callback and session management

Handles OAuth2 callbacks, login/logout, and session endpoints.
"""

import inspect
import os
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from src.auth.oauth2_providers import OAuth2Client
from src.auth.user_repository import UserRepository
from src.auth.session_manager import SessionManager
from src.auth.config import AuthConfig
from src.auth.rbac import require_role, Role, get_current_user
from src.auth.stripe_integration import (
    verify_stripe_webhook,
    process_stripe_webhook,
)
from src.auth.rate_limit_decorator import (
    rate_limit,
    rate_limit_auth_login,
    rate_limit_auth_callback,
    rate_limit_auth_refresh,
)


router = APIRouter(prefix="/auth", tags=["authentication"])

# Templates configuration
templates = Jinja2Templates(directory="src/api/templates")


@router.get("/login")
async def login_page(request: Request):
    """Render login page or redirect if already authenticated."""
    # Check if already logged in
    if getattr(request.state, "authenticated", False):
        return RedirectResponse(url="/dashboard")

    # Get OAuth URLs
    config = AuthConfig()
    google_url = None
    github_url = None

    oauth_config = config.get_oauth_config()
    if oauth_config["google"].enabled:
        google_url = "/auth/google/login"
    if oauth_config["github"].enabled:
        github_url = "/auth/github/login"

    # In dev mode, show auto-login option
    is_dev = config.is_dev_mode()

    # Render login HTML template
    return templates.TemplateResponse(
        "auth/login.html",
        {
            "request": request,
            "oauth_providers": {
                "google": {"enabled": bool(google_url), "url": google_url},
                "github": {"enabled": bool(github_url), "url": github_url},
            },
            "dev_mode": is_dev,
        },
    )


@router.post("/dev-login")
@rate_limit(limit="10/minute", bypass_dev=True)
async def dev_login(request: Request):
    """Development mode quick login (bypasses OAuth).

    Only available when AUTH_ENVIRONMENT=dev.
    Creates a test user and session for local development.

    Rate Limit: 10 requests/minute.
    Bypassed in dev mode (AUTH_ENVIRONMENT=dev).
    """
    config = AuthConfig()

    # Only allow in dev mode
    if not config.is_dev_mode():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev login only available in development mode",
        )

    user_repo = UserRepository()
    session_manager = SessionManager(user_repo)

    # Create or get dev test user
    test_email = "dev@example.com"
    user = await user_repo.find_or_create_user(
        email=test_email,
        provider="local",
        oauth_id="dev-local-user",
        defaults={"name": "Dev User", "role": "owner"}  # Full access for testing
    )

    # Create session with owner role for full access testing
    session, jwt_token, refresh_token = await session_manager.create_session(
        user=user,
        role="owner",
    )

    # Create response with session cookie
    response = JSONResponse({
        "success": True,
        "message": "Dev login successful",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": "owner",
        },
    })

    session_manager.set_session_cookie(response, jwt_token)
    return response


@router.get("/google/login")
@rate_limit_auth_login()
async def google_login(request: Request):
    """Initiate Google OAuth2 flow.

    Rate Limit: 5 requests/minute (AUTH_LOGIN preset).
    Bypassed in dev mode.
    """
    state = os.urandom(16).hex()
    # Store state in session for verification (simplified - use proper session storage)
    request.session["oauth_state"] = state

    client = OAuth2Client()
    try:
        auth_url = client.get_google_oauth_url(state=state)
        return RedirectResponse(url=auth_url)
    finally:
        _close = client.close()
        if inspect.isawaitable(_close):
            await _close


@router.get("/google/callback")
@rate_limit_auth_callback()
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    """Handle Google OAuth2 callback.

    Rate Limit: 10 requests/minute (AUTH_CALLBACK preset).
    Bypassed in dev mode.
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided",
        )

    # Verify state (simplified - implement proper CSRF protection)
    stored_state = request.session.get("oauth_state")
    if stored_state and state != stored_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter",
        )

    client = OAuth2Client()
    try:
        # Handle callback and get user info
        user_info, access_token = await client.handle_google_callback(code)

        # Find or create user
        user_repo = UserRepository()
        user = await user_repo.find_or_create_user(
            email=user_info["email"],
            provider="google",
            oauth_id=user_info["oauth_id"],
        )

        # Create session
        session_manager = SessionManager(user_repo)
        session, jwt_token, refresh_token = await session_manager.create_session(
            user=user,
            role="member",  # Default role, can be updated from license
        )

        # Create response with session cookie
        response = RedirectResponse(url="/dashboard")
        session_manager.set_session_cookie(response, jwt_token)

        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )
    finally:
        _close = client.close()
        if inspect.isawaitable(_close):
            await _close


@router.get("/github/login")
@rate_limit_auth_login()
async def github_login(request: Request):
    """Initiate GitHub OAuth2 flow.

    Rate Limit: 5 requests/minute (AUTH_LOGIN preset).
    Bypassed in dev mode.
    """
    state = os.urandom(16).hex()
    request.session["oauth_state"] = state

    client = OAuth2Client()
    try:
        auth_url = client.get_github_oauth_url(state=state)
        return RedirectResponse(url=auth_url)
    finally:
        _close = client.close()
        if inspect.isawaitable(_close):
            await _close


@router.get("/github/callback")
@rate_limit_auth_callback()
async def github_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    """Handle GitHub OAuth2 callback.

    Rate Limit: 10 requests/minute (AUTH_CALLBACK preset).
    Bypassed in dev mode.
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided",
        )

    # Verify state
    stored_state = request.session.get("oauth_state")
    if stored_state and state != stored_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter",
        )

    client = OAuth2Client()
    try:
        # Handle callback and get user info
        user_info, access_token = await client.handle_github_callback(code)

        # Find or create user
        user_repo = UserRepository()
        user = await user_repo.find_or_create_user(
            email=user_info["email"],
            provider="github",
            oauth_id=user_info["oauth_id"],
        )

        # Create session
        session_manager = SessionManager(user_repo)
        session, jwt_token, refresh_token = await session_manager.create_session(
            user=user,
            role="member",
        )

        # Create response with session cookie
        response = RedirectResponse(url="/dashboard")
        session_manager.set_session_cookie(response, jwt_token)

        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )
    finally:
        _close = client.close()
        if inspect.isawaitable(_close):
            await _close


@router.post("/logout")
@rate_limit(limit="30/hour", bypass_dev=True)
async def logout(request: Request):
    """Logout user and revoke session.

    Rate Limit: 30 requests/hour.
    Bypassed in dev mode.
    """
    session_manager = SessionManager()
    user_repo = UserRepository()

    # Get current session token
    token = session_manager.get_session_cookie(request)

    if token:
        # Validate and revoke session
        user = await session_manager.validate_session(token)
        if user:
            # Find and revoke session
            session = await user_repo.find_session_by_token(token)
            if session:
                await session_manager.revoke_session(session.id)

    # Clear cookie and redirect
    response = RedirectResponse(url="/")
    session_manager.delete_session_cookie(response)
    return response


@router.get("/me")
async def get_current_user_info(request: Request):
    """Get current authenticated user info."""
    user_info = get_current_user(request)

    if not user_info or not user_info.get("id"):
        return {
            "authenticated": False,
            "user": None,
        }

    return {
        "authenticated": True,
        "user": user_info,
    }


@router.get("/refresh")
@rate_limit_auth_refresh()
async def refresh_token(request: Request):
    """Refresh session token.

    Rate Limit: 30 requests/hour (AUTH_REFRESH preset).
    Bypassed in dev mode.
    """
    session_manager = SessionManager()
    token = session_manager.get_session_cookie(request)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token found",
        )

    # Validate current token
    user = await session_manager.validate_session(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )

    # Generate new tokens
    new_access, _ = session_manager.create_access_token(user), None  # new_refresh intentionally unused

    response = JSONResponse({
        "success": True,
        "message": "Token refreshed",
    })
    session_manager.set_session_cookie(response, new_access)
    return response


@router.get("/admin")
@require_role(Role.ADMIN, Role.OWNER)
async def admin_dashboard(request: Request):
    """Admin-only dashboard endpoint."""
    user_info = get_current_user(request)
    return {
        "message": "Admin dashboard accessed",
        "user": user_info,
        "admin_access": True,
    }


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint for real-time subscription updates.

    Handles events:
    - customer.subscription.created - Provision role
    - customer.subscription.updated - Update role
    - customer.subscription.deleted - Downgrade role
    - customer.deleted - Revoke access

    Returns:
        JSONResponse with 200 OK if event handled successfully
    """
    # Get raw payload bytes
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    # Verify webhook signature
    if not verify_stripe_webhook(payload, sig_header):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    # Parse event
    try:
        import json
        event = json.loads(payload.decode("utf-8"))
        event_type = event.get("type")
        event_data = event.get("data", {})

        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event type not found",
            )

        # Process webhook event
        result = await process_stripe_webhook(event_type, event_data)

        if result.get("success"):
            return JSONResponse(
                status_code=200,
                content={"received": True, "message": result.get("message")}
            )
        else:
            return JSONResponse(
                status_code=400,
                content={"received": True, "error": result.get("message")}
            )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )
    except HTTPException:
        raise
    except Exception as e:
        # Still return 200 to prevent Stripe retries for handled errors
        return JSONResponse(
            status_code=200,
            content={"received": True, "error": f"Processing error: {str(e)}"}
        )
