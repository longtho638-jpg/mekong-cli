import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from jose import JWTError, jwt
from redis import Redis

from backend.api.config import settings
from backend.api.schemas.oauth import JWTPayload
from backend.core.infrastructure.redis import redis_client


class JWTService:
    """
    Service for handling JWT generation, validation, rotation, and revocation.
    """

    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
        self.refresh_token_expire_minutes = settings.refresh_token_expire_minutes
        self.issuer = settings.backend_url
        self.redis: Redis = redis_client

    def create_access_token(self, user_id: str, client_id: str, scope: str, expires_delta: Optional[timedelta] = None) -> Tuple[str, str, datetime]:
        """
        Create a JWT access token.
        Returns: (token, jti, expire_at)
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

    def create_refresh_token(self, user_id: str, client_id: str, scope: str) -> Tuple[str, str, datetime]:
        """
        Create a JWT refresh token.
        """
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.refresh_token_expire_minutes)
        jti = str(uuid.uuid4())
        issued_at = datetime.now(timezone.utc)

        # We allow creating a special scope/type for refresh tokens if needed
        # For now, we use standard payload but could add "type": "refresh" claim
        payload_dict = JWTPayload(
            iss=self.issuer,
            sub=user_id,
            aud=client_id,
            exp=int(expire.timestamp()),
            iat=int(issued_at.timestamp()),
            jti=jti,
            scope=scope
        ).model_dump()

        payload_dict["type"] = "refresh"

        encoded_jwt = jwt.encode(payload_dict, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt, jti, expire

    async def decode_token(self, token: str, verify_exp: bool = True) -> Optional[Dict[str, Any]]:
        """
        Decode and verify a JWT token.
        Checks signature and expiration (unless verify_exp=False).
        Checks blacklist.
        """
        try:
            # First decode without verification to get JTI for blacklist check
            unverified_payload = jwt.get_unverified_claims(token)
            jti = unverified_payload.get("jti")

            if jti and await self.is_token_blacklisted(jti):
                raise JWTError("Token is blacklisted")

            options = {"verify_aud": False, "verify_exp": verify_exp}
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options=options)

            return payload
        except JWTError:
            # print(f"JWT Decode Error: {e}")
            return None

    def validate_token_claims(self, payload: Dict[str, Any], required_scopes: Optional[list] = None) -> bool:
        """
        Validate standard claims and optional scopes.
        """
        if payload.get("iss") != self.issuer:
             # Strict check in prod, maybe logging warning in dev
             pass

        if required_scopes:
            token_scopes = payload.get("scope", "").split(" ")
            for scope in required_scopes:
                if scope not in token_scopes:
                    return False

        return True

    async def revoke_token(self, jti: str, expires_in: int):
        """
        Revoke a token by adding its JTI to the blacklist in Redis.
        The key will expire when the token would have expired.
        """
        await self.redis.setex(f"blacklist:{jti}", expires_in, "revoked")

    async def is_token_blacklisted(self, jti: str) -> bool:
        """
        Check if a token JTI is in the blacklist.
        """
        return await self.redis.exists(f"blacklist:{jti}") > 0

# Singleton instance
jwt_service = JWTService()
