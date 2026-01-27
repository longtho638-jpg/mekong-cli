import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.oauth import OAuthToken
from backend.services.jwt_service import JWTService


class TokenService:
    """
    Service for managing OAuth tokens lifecycle and persistence.
    """
    def __init__(self, db: Session):
        self.db = db
        self.jwt_service = JWTService()

    def _hash_token(self, token: str) -> str:
        """Hash opaque token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    def create_tokens(
        self,
        user_id: str,
        client_id: str,
        scope: str,
        access_token_ttl: Optional[timedelta] = None,
        refresh_token_ttl: timedelta = timedelta(days=30)
    ) -> Tuple[str, str, int]:
        """
        Create access token (JWT) and refresh token (Opaque).
        Returns (access_token, refresh_token, expires_in)
        """
        # 1. Create Access Token (JWT)
        access_token, jti, access_expiry = self.jwt_service.create_access_token(
            user_id=user_id,
            client_id=client_id,
            scope=scope,
            expires_delta=access_token_ttl
        )

        # 2. Create Refresh Token (Opaque)
        refresh_token = secrets.token_urlsafe(32)
        refresh_token_hash = self._hash_token(refresh_token)
        refresh_expiry = datetime.now(timezone.utc) + refresh_token_ttl

        # 3. Store in DB
        db_token = OAuthToken(
            access_token_jti=jti,
            refresh_token_hash=refresh_token_hash,
            client_id=client_id,
            user_id=user_id,
            scopes=scope.split(" "),
            access_token_expires_at=access_expiry,
            refresh_token_expires_at=refresh_expiry,
            revoked=False
        )
        self.db.add(db_token)
        self.db.commit()
        self.db.refresh(db_token)

        expires_in = int((access_expiry - datetime.now(timezone.utc)).total_seconds())

        return access_token, refresh_token, expires_in

    def get_token_by_refresh_token(self, refresh_token: str) -> Optional[OAuthToken]:
        """Retrieve token record by refresh token."""
        token_hash = self._hash_token(refresh_token)
        query = select(OAuthToken).where(
            OAuthToken.refresh_token_hash == token_hash,
            OAuthToken.revoked.is_(False),
            OAuthToken.refresh_token_expires_at > datetime.now(timezone.utc)
        )
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def get_token_by_jti(self, jti: str) -> Optional[OAuthToken]:
        """Retrieve token record by JTI."""
        query = select(OAuthToken).where(OAuthToken.access_token_jti == jti)
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    async def revoke_token(self, token_string: str, token_type_hint: Optional[str] = None) -> bool:
        """
        Revoke a token.
        If it's an access token (JWT), we revoke by JTI.
        If it's a refresh token (Opaque), we revoke by hash.
        """
        token_record = None

        # Try as Refresh Token
        if token_type_hint == "refresh_token" or token_type_hint is None:
            token_hash = self._hash_token(token_string)
            query = select(OAuthToken).where(OAuthToken.refresh_token_hash == token_hash)
            result = self.db.execute(query)
            token_record = result.scalar_one_or_none()

        # Try as Access Token
        if not token_record and (token_type_hint == "access_token" or token_type_hint is None):
            payload = await self.jwt_service.decode_token(token_string)
            if payload and "jti" in payload:
                jti = payload["jti"]
                query = select(OAuthToken).where(OAuthToken.access_token_jti == jti)
                result = self.db.execute(query)
                token_record = result.scalar_one_or_none()

        if token_record:
            token_record.revoked = True
            self.db.commit()

            # Sync with Redis Blacklist for immediate revocation
            if token_record.access_token_jti:
                # Calculate remaining TTL
                now = datetime.now(timezone.utc)
                # Ensure timezone awareness for comparison
                expires_at = token_record.access_token_expires_at
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)

                if expires_at > now:
                    expires_in = int((expires_at - now).total_seconds())
                    await self.jwt_service.revoke_token(token_record.access_token_jti, expires_in)

            return True

        return False

    async def rotate_refresh_token(self, old_token_record: OAuthToken) -> Tuple[str, str, int]:
        """
        Revoke old token and issue new pair.
        Used during refresh flow.
        """
        # Revoke old
        old_token_record.revoked = True
        self.db.commit()

        # Blacklist old access token if still valid
        if old_token_record.access_token_jti:
            now = datetime.now(timezone.utc)
            # Ensure timezone awareness
            expires_at = old_token_record.access_token_expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at > now:
                expires_in = int((expires_at - now).total_seconds())
                await self.jwt_service.revoke_token(old_token_record.access_token_jti, expires_in)

        # Issue new
        return self.create_tokens(
            user_id=old_token_record.user_id,
            client_id=old_token_record.client_id,
            scope=" ".join(old_token_record.scopes)
        )
