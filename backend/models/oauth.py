from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base


class OAuthClient(Base):
    __tablename__ = "oauth_clients"

    client_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    client_secret_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    client_name: Mapped[str] = mapped_column(String(100), nullable=False)
    redirect_uris: Mapped[List[str]] = mapped_column(
        JSON, nullable=False
    )  # List of valid redirect URIs
    scopes: Mapped[List[str]] = mapped_column(JSON, nullable=False)  # List of allowed scopes
    grant_types: Mapped[List[str]] = mapped_column(
        JSON, nullable=False
    )  # e.g. ["authorization_code", "refresh_token"]
    is_confidential: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # Public (native app) vs Confidential (server)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tokens = relationship("OAuthToken", back_populates="client")
    grants = relationship("OAuthGrant", back_populates="client")


class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # We store the JTI (unique identifier) of the JWT access token to track it
    access_token_jti: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    # Refresh token (hashed)
    refresh_token_hash: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )

    client_id: Mapped[str] = mapped_column(ForeignKey("oauth_clients.client_id"))
    user_id: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )  # Supabase User ID

    scopes: Mapped[List[str]] = mapped_column(JSON, nullable=False)

    access_token_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    refresh_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client = relationship("OAuthClient", back_populates="tokens")


class OAuthGrant(Base):
    """Authorization Code Grant"""

    __tablename__ = "oauth_grants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    client_id: Mapped[str] = mapped_column(ForeignKey("oauth_clients.client_id"))
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)

    redirect_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    code_challenge: Mapped[str] = mapped_column(String(255), nullable=False)
    code_challenge_method: Mapped[str] = mapped_column(String(10), default="S256")

    scopes: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client = relationship("OAuthClient", back_populates="grants")
