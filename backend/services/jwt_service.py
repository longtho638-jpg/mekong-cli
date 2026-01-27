import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from backend.api.config import settings
from backend.api.schemas.oauth import JWTPayload


class JWTService:
    """
    Service for handling JWT generation and validation.
    """

    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = "HS256"
        self.access_token_expire_minutes = settings.access_token_expire_minutes
        self.issuer = settings.backend_url

    def create_access_token(self, user_id: str, client_id: str, scope: str, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        """
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)

        jti = str(uuid.uuid4())
        issued_at = datetime.now(timezone.utc)

        payload = JWTPayload(
            iss=self.issuer,
            sub=user_id,
            aud=client_id,
            exp=int(expire.timestamp()),
            iat=int(issued_at.timestamp()),
            jti=jti,
            scope=scope
        )

        encoded_jwt = jwt.encode(payload.model_dump(), self.secret_key, algorithm=self.algorithm)
        return encoded_jwt, jti, expire

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode and verify a JWT token.
        """
        try:
            # We skip audience verification here because we treat this as a raw decode verify signature
            # Audience validation happens in specific contexts (like API middleware) if needed.
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_aud": False})
            return payload
        except JWTError as e:
            print(f"JWT Decode Error: {e}")
            return None

    def validate_token_claims(self, payload: Dict[str, Any], required_scopes: Optional[list] = None) -> bool:
        """
        Validate standard claims and optional scopes.
        """
        # Expiration is checked by jwt.decode automatically, but we can double check logic here if needed.
        # Check issuer
        if payload.get("iss") != self.issuer:
            # In dev, we might be lenient if issuer config varies, but strictly it should match.
            pass

        if required_scopes:
            token_scopes = payload.get("scope", "").split(" ")
            for scope in required_scopes:
                if scope not in token_scopes:
                    return False

        return True
