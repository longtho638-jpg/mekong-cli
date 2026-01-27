import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.schemas.oauth import OAuthClientCreate
from backend.models.oauth import OAuthClient, OAuthGrant
from backend.services.token_service import TokenService


class OAuthService:
    """
    Service for OAuth flow orchestration and Client management.
    """
    def __init__(self, db: Session):
        self.db = db
        self.token_service = TokenService(db)

    def _hash_secret(self, secret: str) -> str:
        """Hash client secret using SHA256 (fast and sufficient for high entropy secrets)."""
        return hashlib.sha256(secret.encode()).hexdigest()

    def register_client(self, client_data: OAuthClientCreate) -> Tuple[OAuthClient, str]:
        """
        Register a new OAuth client.
        Returns (client_obj, plain_client_secret)
        """
        client_id = secrets.token_urlsafe(16)
        client_secret = secrets.token_urlsafe(32)
        client_secret_hash = self._hash_secret(client_secret)

        client = OAuthClient(
            client_id=client_id,
            client_secret_hash=client_secret_hash,
            client_name=client_data.client_name,
            redirect_uris=client_data.redirect_uris,
            scopes=client_data.scopes,
            grant_types=client_data.grant_types,
            is_confidential=client_data.is_confidential
        )
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)

        return client, client_secret

    def authenticate_client(self, client_id: str, client_secret: Optional[str]) -> Optional[OAuthClient]:
        """
        Validate client credentials.
        """
        query = select(OAuthClient).where(OAuthClient.client_id == client_id)
        result = self.db.execute(query)
        client = result.scalar_one_or_none()

        if not client:
            return None

        if client.is_confidential:
            if not client_secret:
                return None
            if self._hash_secret(client_secret) != client.client_secret_hash:
                return None

        return client

    def create_authorization_code(
        self,
        client_id: str,
        user_id: str,
        redirect_uri: str,
        code_challenge: str,
        code_challenge_method: str,
        scopes: List[str]
    ) -> str:
        """
        Create a short-lived authorization code.
        """
        code = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10) # 10 min TTL

        grant = OAuthGrant(
            code=code,
            client_id=client_id,
            user_id=user_id,
            redirect_uri=redirect_uri,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            scopes=scopes,
            expires_at=expires_at,
            used=False
        )
        self.db.add(grant)
        self.db.commit()
        return code

    def exchange_authorization_code(
        self,
        code: str,
        redirect_uri: str,
        code_verifier: str,
        client_id: str
    ) -> Tuple[str, str, int]:
        """
        Exchange auth code for tokens (with PKCE verification).
        """
        query = select(OAuthGrant).where(OAuthGrant.code == code)
        result = self.db.execute(query)
        grant = result.scalar_one_or_none()

        if not grant:
            raise ValueError("Invalid authorization code")

        if grant.used:
            raise ValueError("Authorization code already used")

        # Ensure comparison between aware datetimes
        expires_at = grant.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise ValueError("Authorization code expired")

        if grant.client_id != client_id:
            raise ValueError("Client mismatch")

        if grant.redirect_uri != redirect_uri:
            raise ValueError("Redirect URI mismatch")

        # PKCE Verification
        if not self._verify_pkce(code_verifier, grant.code_challenge, grant.code_challenge_method):
            raise ValueError("PKCE verification failed")

        # Mark used
        grant.used = True
        self.db.commit()

        # Issue Tokens
        return self.token_service.create_tokens(
            user_id=grant.user_id,
            client_id=grant.client_id,
            scope=" ".join(grant.scopes)
        )

    def _verify_pkce(self, verifier: str, challenge: str, method: str) -> bool:
        """Verify PKCE challenge."""
        if method == "S256":
            # S256: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
            digest = hashlib.sha256(verifier.encode("ascii")).digest()
            # Base64 url encode without padding
            calculated = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
            return calculated == challenge
        elif method == "plain":
            return verifier == challenge
        else:
            return False # Unsupported method

    def get_client(self, client_id: str) -> Optional[OAuthClient]:
        query = select(OAuthClient).where(OAuthClient.client_id == client_id)
        result = self.db.execute(query)
        return result.scalar_one_or_none()
