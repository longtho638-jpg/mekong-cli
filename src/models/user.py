"""
User Model for OAuth2 Authentication

Dataclass and utilities for managing OAuth2 users from Google and GitHub.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class User:
    """User model for OAuth2 authentication."""

    id: uuid.UUID
    email: str
    oauth_provider: str  # 'google' or 'github'
    oauth_id: str
    role: str = "member"  # RBAC role: viewer, member, admin, owner
    stripe_customer_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create User from database row dict."""
        return cls(
            id=data["id"] if isinstance(data["id"], uuid.UUID) else uuid.UUID(data["id"]),
            email=data["email"],
            oauth_provider=data["oauth_provider"],
            oauth_id=data["oauth_id"],
            role=data.get("role", "member"),
            stripe_customer_id=data.get("stripe_customer_id"),
            created_at=data.get("created_at") or datetime.utcnow(),
            updated_at=data.get("updated_at") or datetime.utcnow(),
        )

    def to_dict(self) -> dict:
        """Convert User to dict for database insertion."""
        return {
            "id": str(self.id),
            "email": self.email,
            "oauth_provider": self.oauth_provider,
            "oauth_id": self.oauth_id,
            "role": self.role,
            "stripe_customer_id": self.stripe_customer_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @property
    def provider_name(self) -> str:
        """Get human-readable provider name."""
        return self.oauth_provider.capitalize()

    def has_role(self, required_role: str) -> bool:
        """Check if user has required role level.

        Role hierarchy: owner > admin > member > viewer
        """
        hierarchy = {"owner": 4, "admin": 3, "member": 2, "viewer": 1}
        user_level = hierarchy.get(self.role, 0)
        required_level = hierarchy.get(required_role, 0)
        return user_level >= required_level


@dataclass
class UserSession:
    """User session model for JWT token management."""

    id: uuid.UUID
    user_id: uuid.UUID
    token_hash: str
    expires_at: datetime
    created_at: datetime = field(default_factory=datetime.utcnow)

    @classmethod
    def from_dict(cls, data: dict) -> "UserSession":
        """Create UserSession from database row dict."""
        return cls(
            id=data["id"] if isinstance(data["id"], uuid.UUID) else uuid.UUID(data["id"]),
            user_id=data["user_id"] if isinstance(data["user_id"], uuid.UUID) else uuid.UUID(data["user_id"]),
            token_hash=data["token_hash"],
            expires_at=data["expires_at"],
            created_at=data.get("created_at") or datetime.utcnow(),
        )

    def to_dict(self) -> dict:
        """Convert UserSession to dict for database insertion."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "token_hash": self.token_hash,
            "expires_at": self.expires_at,
            "created_at": self.created_at,
        }

    def is_valid(self) -> bool:
        """Check if session is still valid."""
        return datetime.utcnow() < self.expires_at


@dataclass
class LicenseWithRole:
    """License with RBAC role."""

    id: int
    license_key: str
    email: str
    role: str  # 'owner', 'admin', 'member', 'viewer'
    status: str = "active"
    tier: str = "free"

    @classmethod
    def from_dict(cls, data: dict) -> "LicenseWithRole":
        """Create LicenseWithRole from database row dict."""
        return cls(
            id=data["id"],
            license_key=data["license_key"],
            email=data["email"],
            role=data.get("role", "member"),
            status=data.get("status", "active"),
            tier=data.get("tier", "free"),
        )

    def has_permission(self, required_role: str) -> bool:
        """Check if user has required permission level.

        Role hierarchy: owner > admin > member > viewer
        """
        hierarchy = {"owner": 4, "admin": 3, "member": 2, "viewer": 1}
        user_level = hierarchy.get(self.role, 0)
        required_level = hierarchy.get(required_role, 0)
        return user_level >= required_level
