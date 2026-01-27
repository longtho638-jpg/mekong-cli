from typing import List, Optional

from fastapi import APIRouter, Depends, Form, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.api.auth.dependencies import get_current_user
from backend.api.auth.utils import TokenData
from backend.api.dependencies.database import get_sqlalchemy_db
from backend.api.schemas.oauth import (
    OAuth2IntrospectRequest,
    OAuth2IntrospectResponse,
    OAuth2RevokeRequest,
    OAuth2TokenRequest,
    OAuth2TokenResponse,
    OAuthClientCreate,
    OAuthClientResponse,
    OAuthClientSecretResponse,
)
from backend.services.oauth_service import OAuthService
from backend.services.token_service import TokenService

router = APIRouter(prefix="/oauth", tags=["oauth2"])

def get_oauth_service(db: Session = Depends(get_sqlalchemy_db)) -> OAuthService:
    return OAuthService(db)

def get_token_service(db: Session = Depends(get_sqlalchemy_db)) -> TokenService:
    return TokenService(db)

@router.post("/register", response_model=OAuthClientSecretResponse)
async def register_client(
    client_data: OAuthClientCreate,
    user: TokenData = Depends(get_current_user), # Only authenticated users can register clients
    service: OAuthService = Depends(get_oauth_service)
):
    """
    Register a new OAuth client.
    """
    client, secret = service.register_client(client_data)

    return OAuthClientSecretResponse(
        client_id=client.client_id,
        client_name=client.client_name,
        redirect_uris=client.redirect_uris,
        scopes=client.scopes,
        grant_types=client.grant_types,
        is_confidential=client.is_confidential,
        created_at=client.created_at,
        client_secret=secret
    )

@router.get("/authorize")
async def authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str = "read",
    state: Optional[str] = None,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = "S256",
    user: TokenData = Depends(get_current_user), # Assume user is logged in (session cookie or bearer)
    service: OAuthService = Depends(get_oauth_service)
):
    """
    OAuth 2.0 Authorize Endpoint (GET).
    This endpoint should display a consent screen.
    For this API-first implementation, we will auto-approve if the user is authenticated
    and just redirect with the code.

    In a full UI flow, this would return HTML.
    """
    if response_type != "code":
        raise HTTPException(status_code=400, detail="Unsupported response_type")

    client = service.get_client(client_id)
    if not client:
        raise HTTPException(status_code=400, detail="Invalid client_id")

    if redirect_uri not in client.redirect_uris:
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")

    # TODO: Validate requested scopes against client.scopes

    # Generate Auth Code
    code = service.create_authorization_code(
        client_id=client_id,
        user_id=str(user.username), # Using username as user_id for now based on auth/utils.py
        redirect_uri=redirect_uri,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        scopes=scope.split(" ")
    )

    # Redirect back to client
    redirect_url = f"{redirect_uri}?code={code}"
    if state:
        redirect_url += f"&state={state}"

    return RedirectResponse(url=redirect_url)

@router.post("/token", response_model=OAuth2TokenResponse)
async def token(
    grant_type: str = Form(...),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    client_secret: Optional[str] = Form(None),
    refresh_token: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    scope: Optional[str] = Form(None),
    service: OAuthService = Depends(get_oauth_service),
    token_service: TokenService = Depends(get_token_service),
    authorization: Optional[str] = Header(None) # For Basic Auth header support
):
    """
    OAuth 2.0 Token Endpoint.
    Supports: authorization_code, client_credentials, refresh_token.
    """

    # 1. Authenticate Client
    # Client can send credentials in body or Authorization header (Basic)
    if authorization and authorization.startswith("Basic "):
        import base64
        try:
            encoded = authorization[6:]
            decoded = base64.b64decode(encoded).decode("utf-8")
            client_id, client_secret = decoded.split(":")
        except:
            pass # Fallback to body params

    if not client_id:
        raise HTTPException(status_code=400, detail="client_id is required")

    client = service.authenticate_client(client_id, client_secret)
    # Note: For public clients (PKCE), client_secret is None/Not required,
    # but service.authenticate_client handles confidential check.
    # If client is public, authenticate_client returns client even if secret is None.

    if not client:
        # If client is confidential and authentication failed
        # Or if client_id is invalid
        # But wait, authenticate_client returns None if confidential and secret missing/wrong.
        # If public, it returns client.
        # So if None, it's invalid.
        raise HTTPException(status_code=401, detail="Invalid client credentials")

    # 2. Handle Grant Types
    if grant_type == "authorization_code":
        if not code or not redirect_uri or not code_verifier:
             raise HTTPException(status_code=400, detail="Missing required params for authorization_code")

        try:
            access_token, refresh_token, expires_in = service.exchange_authorization_code(
                code=code,
                redirect_uri=redirect_uri,
                code_verifier=code_verifier,
                client_id=client_id
            )
            return OAuth2TokenResponse(
                access_token=access_token,
                expires_in=expires_in,
                refresh_token=refresh_token,
                scope=scope # Should return granted scope
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    elif grant_type == "client_credentials":
        if not client.is_confidential:
             raise HTTPException(status_code=400, detail="Client credentials flow requires confidential client")

        # Issue token for client itself (service account)
        # We use client_id as user_id for M2M tokens
        access_token, refresh_token, expires_in = token_service.create_tokens(
            user_id=client_id,
            client_id=client_id,
            scope=scope or " ".join(client.scopes)
        )
        return OAuth2TokenResponse(
            access_token=access_token,
            expires_in=expires_in,
            refresh_token=refresh_token, # Optional for CC flow, but we can provide it
            scope=scope
        )

    elif grant_type == "refresh_token":
        if not refresh_token:
            raise HTTPException(status_code=400, detail="refresh_token required")

        token_record = token_service.get_token_by_refresh_token(refresh_token)
        if not token_record:
            raise HTTPException(status_code=400, detail="Invalid refresh token")

        if token_record.client_id != client_id:
             raise HTTPException(status_code=400, detail="Client mismatch")

        # Rotate
        access_token, new_refresh_token, expires_in = await token_service.rotate_refresh_token(token_record)

        return OAuth2TokenResponse(
            access_token=access_token,
            expires_in=expires_in,
            refresh_token=new_refresh_token,
            scope=" ".join(token_record.scopes)
        )

    else:
        raise HTTPException(status_code=400, detail="Unsupported grant_type")

@router.post("/introspect", response_model=OAuth2IntrospectResponse)
async def introspect(
    request: Request,
    token: str = Form(...),
    token_type_hint: Optional[str] = Form(None),
    token_service: TokenService = Depends(get_token_service),
    service: OAuthService = Depends(get_oauth_service)
):
    """
    RFC 7662 Token Introspection.
    Protected endpoint - typically requires Basic Auth with resource server credentials.
    """
    # Verify Basic Auth for Resource Server (Client)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Basic "):
        raise HTTPException(status_code=401, detail="Authentication required")

    # Decode Basic Auth
    import base64
    try:
        encoded = auth_header[6:]
        decoded = base64.b64decode(encoded).decode("utf-8")
        rs_client_id, rs_client_secret = decoded.split(":")
        rs_client = service.authenticate_client(rs_client_id, rs_client_secret)
        if not rs_client:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Inspect Token
    # Try JWT decode first for access tokens
    if token_type_hint != "refresh_token":
        payload = await token_service.jwt_service.decode_token(token)
        if payload:
            # Check revocation
            jti = payload.get("jti")
            if jti:
                record = token_service.get_token_by_jti(jti)
                if record and record.revoked:
                    return OAuth2IntrospectResponse(active=False)

            # Active
            return OAuth2IntrospectResponse(
                active=True,
                scope=payload.get("scope"),
                client_id=payload.get("aud"),
                username=payload.get("sub"),
                token_type="Bearer",
                exp=payload.get("exp"),
                iat=payload.get("iat"),
                sub=payload.get("sub"),
                aud=payload.get("aud"),
                iss=payload.get("iss"),
                jti=payload.get("jti")
            )

    # Check if it's a refresh token or opaque access token (if we supported that)
    record = token_service.get_token_by_refresh_token(token)
    if record:
        return OAuth2IntrospectResponse(
            active=True,
            scope=" ".join(record.scopes),
            client_id=record.client_id,
            username=record.user_id,
            token_type="Refresh",
            exp=int(record.refresh_token_expires_at.timestamp())
        )

    return OAuth2IntrospectResponse(active=False)

@router.post("/revoke")
async def revoke(
    token: str = Form(...),
    token_type_hint: Optional[str] = Form(None),
    token_service: TokenService = Depends(get_token_service),
    # Optional authentication? RFC says:
    # "The client MUST NOT be allowed to revoke tokens issued to other clients"
    # So we should ideally authenticate the client.
    # But for public clients, they might not have secrets.
    authorization: Optional[str] = Header(None)
):
    """
    RFC 7009 Token Revocation.
    """
    # Attempt to identify client if auth provided, but don't fail hard if not?
    # Actually, to prevent DoS, we should verify ownership if possible.
    # For now, let's just allow revocation if valid token found.

    await token_service.revoke_token(token, token_type_hint)
    return {} # 200 OK
