import hashlib
import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

import bcrypt
from postgrest import APIError

from backend.api.schemas.public_api import ApiKeyResponse
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)


class ApiKeyService:
    """
    Service for managing Public API Keys.
    Handles generation, hashing, verification, and revocation.
    """

    def __init__(self):
        self.db = get_db()
        self.prefix_length = 8
        self.key_prefix = "aky_live_"

    def generate_api_key(
        self, user_id: str, name: str, scopes: List[str] = [], tier: str = "free"
    ) -> ApiKeyResponse:
        """
        Generate a new API key for a user.

        Format: aky_live_<random_32_chars>
        We store:
        - prefix: aky_live_<first_8_random_chars> (for lookup)
        - key_hash: bcrypt hash of the full key (for verification)
        """
        # 1. Generate random key
        random_part = secrets.token_urlsafe(32)
        full_key = f"{self.key_prefix}{random_part}"

        # 2. Extract prefix for indexing/lookup
        # prefix is the standard prefix + first 8 chars of random part
        # e.g. aky_live_AbCdEfGh
        prefix_part = random_part[: self.prefix_length]
        prefix = f"{self.key_prefix}{prefix_part}"

        # 3. Hash the full key
        # Bcrypt requires bytes
        salt = bcrypt.gensalt()
        key_hash = bcrypt.hashpw(full_key.encode("utf-8"), salt).decode("utf-8")

        # 4. Store in DB
        try:
            data = {
                "user_id": user_id,
                "name": name,
                "key_hash": key_hash,
                "prefix": prefix,
                "scopes": scopes,
                "tier": tier,
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }

            result = self.db.table("api_keys").insert(data).execute()

            if not result.data:
                raise Exception("Failed to insert API key")

            record = result.data[0]

            # Return the full key ONLY this one time
            response = ApiKeyResponse(**record)
            response.key = full_key

            return response

        except APIError as e:
            logger.error(f"Database error generating API key: {e}")
            raise e
        except Exception as e:
            logger.error(f"Error generating API key: {e}")
            raise e

    def verify_api_key(self, full_key: str) -> Optional[Dict[str, Any]]:
        """
        Verify an API key and return its metadata if valid.
        Increments usage counter (last_used_at).
        """
        if not full_key.startswith(self.key_prefix):
            return None

        # 1. Extract prefix to find candidate keys
        # Remove standard prefix to get random part
        # Key: aky_live_RANDOM...
        # Prefix stored: aky_live_PREFIX...

        # Determine strict prefix from the key
        # The stored prefix is `aky_live_` + first 8 chars of random part.
        # Length of `aky_live_` is 9.
        # So we take 9 + 8 = 17 chars.

        if len(full_key) < 17:
            return None

        prefix_to_search = full_key[:17]

        try:
            # 2. Lookup by prefix
            result = (
                self.db.table("api_keys")
                .select("*")
                .eq("prefix", prefix_to_search)
                .eq("status", "active")
                .execute()
            )

            candidates = result.data

            if not candidates:
                return None

            # 3. Verify hash
            for record in candidates:
                stored_hash = record["key_hash"]
                if bcrypt.checkpw(full_key.encode("utf-8"), stored_hash.encode("utf-8")):
                    # Valid key!

                    # 4. Check expiration
                    if record.get("expires_at"):
                        expires_at = datetime.fromisoformat(
                            record["expires_at"].replace("Z", "+00:00")
                        )
                        if datetime.utcnow().replace(tzinfo=None) > expires_at.replace(tzinfo=None):
                            logger.info(f"API Key {record['id']} expired")
                            return None

                    # 5. Async update last_used_at (fire and forget ideally, but here sync)
                    try:
                        self.db.table("api_keys").update(
                            {"last_used_at": datetime.utcnow().isoformat()}
                        ).eq("id", record["id"]).execute()
                    except Exception as e:
                        logger.warning(f"Failed to update last_used_at: {e}")

                    return record

            return None

        except Exception as e:
            logger.error(f"Error verifying API key: {e}")
            return None

    def revoke_api_key(self, key_id: str, user_id: str) -> bool:
        """Revoke an API key."""
        try:
            # Ensure user owns the key
            result = (
                self.db.table("api_keys")
                .update({"status": "revoked"})
                .eq("id", key_id)
                .eq("user_id", user_id)
                .execute()
            )

            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error revoking API key: {e}")
            return False

    def list_api_keys(self, user_id: str) -> List[ApiKeyResponse]:
        """List all API keys for a user."""
        try:
            result = (
                self.db.table("api_keys")
                .select("*")
                .eq("user_id", user_id)
                .neq("status", "revoked")
                .execute()
            )

            return [ApiKeyResponse(**r) for r in result.data]
        except Exception as e:
            logger.error(f"Error listing API keys: {e}")
            return []

    def rotate_api_key(
        self, key_id: str, user_id: str, grace_period_hours: int = 24
    ) -> ApiKeyResponse:
        """
        Rotate a key:
        1. Create new key with same config
        2. Set old key to expire in X hours
        """
        try:
            # Get old key
            old_key_res = (
                self.db.table("api_keys")
                .select("*")
                .eq("id", key_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not old_key_res.data:
                raise ValueError("Key not found")

            old_key = old_key_res.data[0]

            # Create new key
            new_key = self.generate_api_key(
                user_id=user_id,
                name=f"{old_key['name']} (Rotated)",
                scopes=old_key["scopes"],
                tier=old_key["tier"],
            )

            # Set expiration on old key
            expires_at = datetime.utcnow() + timedelta(hours=grace_period_hours)
            self.db.table("api_keys").update(
                {
                    "expires_at": expires_at.isoformat(),
                    "status": "expiring",  # Custom status indicating it's on its way out
                }
            ).eq("id", key_id).execute()

            return new_key

        except Exception as e:
            logger.error(f"Error rotating API key: {e}")
            raise e
