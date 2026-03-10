"""
User Repository - Database operations for OAuth2 users

Handles user creation, lookup, and session management.
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from src.db.database import DatabaseConnection, get_database
from src.models.user import User, UserSession


# Session configuration
SESSION_EXPIRY_HOURS = 24
SESSION_MAX_AGE = SESSION_EXPIRY_HOURS * 60 * 60  # seconds


def hash_token(token: str) -> str:
    """Hash session token for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


class UserRepository:
    """Repository for user and session database operations."""

    def __init__(self, db: Optional[DatabaseConnection] = None):
        self._db = db or get_database()

    # === User Operations ===

    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email address."""
        query = "SELECT * FROM users WHERE email = $1"
        row = await self._db.fetch_one(query, (email,))
        return User.from_dict(row) if row else None

    async def find_by_oauth(
        self,
        provider: str,
        oauth_id: str,
    ) -> Optional[User]:
        """Find user by OAuth provider and ID."""
        query = "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2"
        row = await self._db.fetch_one(query, (provider, oauth_id))
        return User.from_dict(row) if row else None

    async def create_user(
        self,
        email: str,
        provider: str,
        oauth_id: str,
    ) -> User:
        """Create a new user.

        Args:
            email: User email address
            provider: OAuth provider ('google' or 'github')
            oauth_id: Provider's user ID

        Returns:
            Created User object
        """
        query = """
            INSERT INTO users (email, oauth_provider, oauth_id)
            VALUES ($1, $2, $3)
            RETURNING *
        """
        row = await self._db.fetch_one(query, (email, provider, oauth_id))
        if not row:
            raise ValueError("Failed to create user")
        return User.from_dict(row)

    async def find_or_create_user(
        self,
        email: str,
        provider: str,
        oauth_id: str,
    ) -> User:
        """Find existing user or create new one.

        Args:
            email: User email address
            provider: OAuth provider ('google' or 'github')
            oauth_id: Provider's user ID

        Returns:
            Existing or newly created User
        """
        # Try to find by OAuth provider first
        user = await self.find_by_oauth(provider, oauth_id)
        if user:
            return user

        # Try to find by email (user may have registered with different provider)
        user = await self.find_by_email(email)
        if user:
            return user

        # Create new user
        return await self.create_user(email, provider, oauth_id)

    async def update_user(self, user_id: uuid.UUID, **kwargs: Any) -> Optional[User]:
        """Update user fields."""
        if not kwargs:
            return await self.find_by_id(user_id)

        # Build dynamic update query
        fields = ", ".join(f"{k} = ${i+1}" for i, k in enumerate(kwargs.keys()))
        values = list(kwargs.values())

        query = f"""
            UPDATE users SET {fields}, updated_at = NOW()
            WHERE id = ${len(values) + 1}
            RETURNING *
        """
        values.append(str(user_id))
        row = await self._db.fetch_one(query, tuple(values))
        return User.from_dict(row) if row else None

    async def update_user_role(self, user_id: uuid.UUID, role: str) -> Optional[User]:
        """
        Update user role from Stripe subscription sync.

        Args:
            user_id: User UUID
            role: Role string ('owner', 'admin', 'member', 'viewer')

        Returns:
            Updated User object or None if not found
        """
        query = """
            UPDATE users SET role = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        """
        row = await self._db.fetch_one(query, (role, str(user_id)))
        return User.from_dict(row) if row else None

    async def get_user_with_role(self, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get user with their current role.

        Args:
            user_id: User UUID

        Returns:
            Dict with user info and role, or None if not found
        """
        query = """
            SELECT id, email, oauth_provider, oauth_id, role, created_at, updated_at
            FROM users
            WHERE id = $1
        """
        row = await self._db.fetch_one(query, (str(user_id),))
        if not row:
            return None

        return {
            "id": row["id"],
            "email": row["email"],
            "oauth_provider": row["oauth_provider"],
            "oauth_id": row["oauth_id"],
            "role": row.get("role", "member"),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    async def find_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Find user by ID."""
        query = "SELECT * FROM users WHERE id = $1"
        row = await self._db.fetch_one(query, (str(user_id),))
        return User.from_dict(row) if row else None

    async def delete_user(self, user_id: uuid.UUID) -> bool:
        """Delete user and associated sessions (CASCADE)."""
        query = "DELETE FROM users WHERE id = $1"
        result = await self._db.execute(query, (str(user_id),))
        return "DELETE" in result

    # === Session Operations ===

    async def create_session(
        self,
        user_id: uuid.UUID,
        token: str,
        expires_hours: int = SESSION_EXPIRY_HOURS,
    ) -> UserSession:
        """Create a new user session.

        Args:
            user_id: User UUID
            token: Session token (will be hashed before storage)
            expires_hours: Session expiration in hours

        Returns:
            Created UserSession object
        """
        token_hash = hash_token(token)
        expires_at = datetime.utcnow() + timedelta(hours=expires_hours)

        query = """
            INSERT INTO user_sessions (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
        """
        row = await self._db.fetch_one(
            query,
            (str(user_id), token_hash, expires_at),
        )
        if not row:
            raise ValueError("Failed to create session")
        return UserSession.from_dict(row)

    async def find_session_by_token(self, token: str) -> Optional[UserSession]:
        """Find session by token (hashes token and looks up)."""
        token_hash = hash_token(token)
        query = """
            SELECT s.*, u.email, u.oauth_provider
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token_hash = $1 AND s.expires_at > NOW()
        """
        row = await self._db.fetch_one(query, (token_hash,))
        return UserSession.from_dict(row) if row else None

    async def find_session_by_id(self, session_id: uuid.UUID) -> Optional[UserSession]:
        """Find session by ID."""
        query = """
            SELECT s.*, u.email, u.oauth_provider
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = $1 AND s.expires_at > NOW()
        """
        row = await self._db.fetch_one(query, (str(session_id),))
        return UserSession.from_dict(row) if row else None

    async def find_user_sessions(self, user_id: uuid.UUID) -> List[UserSession]:
        """Find all valid sessions for a user."""
        query = """
            SELECT * FROM user_sessions
            WHERE user_id = $1 AND expires_at > NOW()
            ORDER BY created_at DESC
        """
        rows = await self._db.fetch_all(query, (str(user_id),))
        return [UserSession.from_dict(row) for row in rows]

    async def delete_session(self, session_id: uuid.UUID) -> bool:
        """Delete a session (logout)."""
        query = "DELETE FROM user_sessions WHERE id = $1"
        result = await self._db.execute(query, (str(session_id),))
        return "DELETE" in result

    async def delete_user_sessions(self, user_id: uuid.UUID) -> int:
        """Delete all sessions for a user (logout everywhere)."""
        query = "DELETE FROM user_sessions WHERE user_id = $1"
        result = await self._db.execute(query, (str(user_id),))
        # Parse result like "DELETE 3" to get count
        parts = result.split()
        return int(parts[1]) if len(parts) > 1 else 0

    async def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions from database.

        Returns:
            Number of sessions deleted
        """
        query = "SELECT cleanup_expired_sessions()"
        result = await self._db.fetchval(query)
        return result or 0


# Convenience functions for simple usage

async def find_or_create_user(
    email: str,
    provider: str,
    oauth_id: str,
) -> User:
    """Find or create user from OAuth2 login."""
    repo = UserRepository()
    return await repo.find_or_create_user(email, provider, oauth_id)


async def create_session(user_id: uuid.UUID, token: str) -> UserSession:
    """Create user session."""
    repo = UserRepository()
    return await repo.create_session(user_id, token)


async def find_session(token: str) -> Optional[UserSession]:
    """Find session by token."""
    repo = UserRepository()
    return await repo.find_session_by_token(token)


async def logout(session_id: uuid.UUID) -> bool:
    """Delete session (logout)."""
    repo = UserRepository()
    return await repo.delete_session(session_id)
