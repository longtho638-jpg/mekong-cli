"""
Admin Service - System administration and management logic.

Handles user management, system configuration, and audit logging.
Connects to Supabase using the service role key for elevated privileges.
"""
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from gotrue.errors import AuthApiError

from backend.models.admin import (
    AdminAuditLog,
    AdminUser,
    FeatureFlag,
    FeatureFlagCreate,
    FeatureFlagUpdate,
    SystemSetting,
    SystemSettingUpdate,
)
from supabase import Client, create_client

logger = logging.getLogger(__name__)

class AdminService:
    """Service for system administration."""

    def __init__(self):
        """Initialize Supabase client with service role for admin access."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        self.client: Client = create_client(supabase_url, supabase_key)

    # --- User Management ---

    def list_users(self, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """
        List users with pagination using Supabase Auth Admin API.

        Note: The Python SDK for Supabase Auth Admin might vary.
        We'll try to use the auth.admin interface.
        """
        try:
            # Calculate offset/limit if supported, otherwise just fetch generic list
            # gotrue-py list_users takes (page, per_page)
            # The result object typically has 'users' and 'total'
            response = self.client.auth.admin.list_users(
                page=page,
                per_page=per_page
            )

            # Map to AdminUser model
            users = []
            for u in response.users:
                users.append(AdminUser(
                    id=u.id,
                    email=u.email or "",
                    role=u.role or "user",
                    created_at=datetime.fromisoformat(u.created_at.replace('Z', '+00:00')) if u.created_at else datetime.now(),
                    last_sign_in_at=datetime.fromisoformat(u.last_sign_in_at.replace('Z', '+00:00')) if u.last_sign_in_at else None,
                    app_metadata=u.app_metadata or {},
                    user_metadata=u.user_metadata or {},
                    banned_until=datetime.fromisoformat(u.banned_until.replace('Z', '+00:00')) if hasattr(u, 'banned_until') and u.banned_until else None
                ))

            return {
                "users": users,
                "total": getattr(response, 'total', len(users)), # Fallback if total not provided
                "page": page,
                "per_page": per_page
            }
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            raise

    def get_user(self, user_id: str) -> Optional[AdminUser]:
        """Get a single user details."""
        try:
            u = self.client.auth.admin.get_user_by_id(user_id)
            if not u:
                return None

            return AdminUser(
                id=u.id,
                email=u.email or "",
                role=u.role or "user",
                created_at=datetime.fromisoformat(u.created_at.replace('Z', '+00:00')) if u.created_at else datetime.now(),
                last_sign_in_at=datetime.fromisoformat(u.last_sign_in_at.replace('Z', '+00:00')) if u.last_sign_in_at else None,
                app_metadata=u.app_metadata or {},
                user_metadata=u.user_metadata or {},
                banned_until=datetime.fromisoformat(u.banned_until.replace('Z', '+00:00')) if hasattr(u, 'banned_until') and u.banned_until else None
            )
        except AuthApiError:
            return None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            raise

    def ban_user(self, user_id: str, duration: Optional[str] = None) -> bool:
        """
        Ban a user.
        duration: 'forever' or None for indefinite, or ISO timestamp string.
        """
        try:
            ban_duration = "none"
            if duration == "forever" or duration is None:
                # Ban until year 9999
                ban_until = datetime(9999, 12, 31).isoformat()
            elif duration == "none":
                 ban_until = None # Unban
            else:
                ban_until = duration # Assume ISO format

            self.client.auth.admin.update_user_by_id(
                user_id,
                {"ban_duration": ban_until} # Note: Check exact API parameter for ban
            )
            return True
        except Exception as e:
            logger.error(f"Error banning user {user_id}: {e}")
            # Supabase might handle bans differently (e.g. banned_until field)
            # Try updating `banned_until` directly if SDK supports it
            try:
                self.client.auth.admin.update_user_by_id(user_id, {"banned_until": ban_until})
                return True
            except:
                raise e

    def update_user_role(self, user_id: str, role: str) -> bool:
        """Update user role in app_metadata."""
        try:
            self.client.auth.admin.update_user_by_id(
                user_id,
                {"app_metadata": {"role": role}}
            )
            return True
        except Exception as e:
            logger.error(f"Error updating user role {user_id}: {e}")
            raise

    # --- Feature Flags ---

    def list_feature_flags(self) -> List[FeatureFlag]:
        """List all feature flags."""
        result = self.client.table("feature_flags").select("*").execute()
        return [FeatureFlag(**item) for item in result.data]

    def get_feature_flag(self, key: str) -> Optional[FeatureFlag]:
        """Get a feature flag by key."""
        result = self.client.table("feature_flags").select("*").eq("key", key).execute()
        if result.data:
            return FeatureFlag(**result.data[0])
        return None

    def create_feature_flag(self, flag: FeatureFlagCreate) -> FeatureFlag:
        """Create a new feature flag."""
        data = flag.dict()
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()

        result = self.client.table("feature_flags").insert(data).execute()
        return FeatureFlag(**result.data[0])

    def update_feature_flag(self, key: str, updates: FeatureFlagUpdate) -> FeatureFlag:
        """Update a feature flag."""
        data = updates.dict(exclude_unset=True)
        data["updated_at"] = datetime.now().isoformat()

        result = self.client.table("feature_flags").update(data).eq("key", key).execute()
        return FeatureFlag(**result.data[0])

    def delete_feature_flag(self, key: str) -> bool:
        """Delete a feature flag."""
        self.client.table("feature_flags").delete().eq("key", key).execute()
        return True

    # --- System Settings ---

    def list_settings(self) -> List[SystemSetting]:
        """List all system settings."""
        result = self.client.table("system_settings").select("*").execute()
        return [SystemSetting(**item) for item in result.data]

    def get_setting(self, key: str) -> Optional[SystemSetting]:
        """Get a setting by key."""
        result = self.client.table("system_settings").select("*").eq("key", key).execute()
        if result.data:
            return SystemSetting(**result.data[0])
        return None

    def update_setting(self, key: str, updates: SystemSettingUpdate, user_id: str) -> SystemSetting:
        """Update a system setting."""
        data = updates.dict(exclude_unset=True)
        data["updated_at"] = datetime.now().isoformat()
        data["updated_by"] = user_id

        # Check if setting exists, if not create
        existing = self.get_setting(key)
        if existing:
            result = self.client.table("system_settings").update(data).eq("key", key).execute()
        else:
            data["key"] = key
            result = self.client.table("system_settings").insert(data).execute()

        return SystemSetting(**result.data[0])

    # --- Audit Logs ---

    def get_audit_logs(self, limit: int = 50, offset: int = 0) -> List[AdminAuditLog]:
        """Get system audit logs."""
        # Use system_audit_logs table
        result = self.client.table("system_audit_logs")\
            .select("*")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()

        return [AdminAuditLog(**item) for item in result.data]

    def get_system_stats(self) -> Dict[str, Any]:
        """Get aggregated system statistics."""
        # This aggregates data from multiple sources

        # 1. Total Users
        users_resp = self.client.auth.admin.list_users(per_page=1)
        total_users = getattr(users_resp, 'total', 0)

        # 2. Total Tenants
        tenants_resp = self.client.table("tenants").select("id", count="exact").limit(1).execute()
        total_tenants = tenants_resp.count or 0

        # 3. Revenue Stats (using existing view if available or simplified calc)
        # We can re-use logic from RevenueService if needed, but let's keep it simple here
        # or fetch from revenue_snapshots latest

        revenue_data = {"mrr": 0, "arr": 0, "active_subs": 0}
        try:
             # Try to get latest system-wide snapshot if implemented,
             # otherwise sum up from tenants (might be slow)
             # For now, return 0 placeholders or query specific tables
             pass
        except:
            pass

        return {
            "total_users": total_users,
            "total_tenants": total_tenants,
            "system_health": "healthy", # Placeholder
            "version": "1.0.0"
        }
