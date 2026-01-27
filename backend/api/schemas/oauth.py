from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class OAuth2TokenRequest(BaseModel):
    grant_type: str
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    refresh_token: Optional[str] = None
    code_verifier: Optional[str] = None
    scope: Optional[str] = None

class OAuth2TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    scope: Optional[str] = None
    id_token: Optional[str] = None # For OIDC future proofing

class OAuth2IntrospectRequest(BaseModel):
    token: str
    token_type_hint: Optional[str] = None

class OAuth2IntrospectResponse(BaseModel):
    active: bool
    scope: Optional[str] = None
    client_id: Optional[str] = None
    username: Optional[str] = None
    token_type: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    nbf: Optional[int] = None
    sub: Optional[str] = None
    aud: Optional[str] = None
    iss: Optional[str] = None
    jti: Optional[str] = None

class OAuth2RevokeRequest(BaseModel):
    token: str
    token_type_hint: Optional[str] = None

class OAuthClientCreate(BaseModel):
    client_name: str
    redirect_uris: List[str]
    grant_types: List[str] = ["authorization_code", "refresh_token"]
    scopes: List[str] = ["read", "write"]
    is_confidential: bool = True

class OAuthClientResponse(BaseModel):
    client_id: str
    client_name: str
    redirect_uris: List[str]
    scopes: List[str]
    grant_types: List[str]
    is_confidential: bool
    created_at: datetime

class OAuthClientSecretResponse(OAuthClientResponse):
    client_secret: str # Only returned once upon creation

class JWTPayload(BaseModel):
    iss: str
    sub: str
    aud: str
    exp: int
    iat: int
    jti: str
    scope: str
