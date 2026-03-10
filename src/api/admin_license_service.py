"""
Admin License Service — ROIaaS Phase 2

Admin operations for license management with audit logging.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.lib.license_generator import generate_license, validate_license
from src.db.repository import get_repository, LicenseRepository


class AdminLicenseService:
    """Service for admin license operations with audit logging."""

    def __init__(self, repository: Optional[LicenseRepository] = None) -> None:
        self._repo = repository or get_repository()
        self._admin_email = os.getenv("ADMIN_EMAIL", "admin@mekong.dev")

    async def create_license(
        self,
        tier: str,
        email: str,
        days: Optional[int] = None,
        quantity: int = 1,
        notes: Optional[str] = None,
        created_by: Optional[str] = None,
        actor_ip: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create one or multiple license keys.

        Args:
            tier: License tier (free, trial, pro, enterprise)
            email: User email for license
            days: Expiry in days (for trial tier)
            quantity: Number of keys to generate (bulk create)
            notes: Optional notes for the license
            created_by: Admin email who created the license
            actor_ip: IP address of the admin

        Returns:
            Dict with keys, license_ids, and metadata
        """
        from src.lib.raas_gate_validator import get_validator

        generated_keys = []
        license_ids = []

        for _ in range(quantity):
            # Generate key
            key = generate_license(tier, email, days)

            # Validate to get key_id
            is_valid, info, _ = validate_license(key)
            if not is_valid:
                continue

            key_id = info.get("key_id", "unknown") if info else "unknown"

            # Create in database
            result = await self._repo.create_license(
                license_key=key,
                key_id=key_id,
                tier=tier,
                email=email,
                daily_limit=self._get_tier_limit(tier),
                expires_at=None,  # No expiry for now
                metadata={"notes": notes} if notes else {},
            )

            if result:
                generated_keys.append(key)
                license_ids.append(result.get("id"))

                # Update created_by if provided
                if created_by:
                    await self._repo.update_license(key_id, {"created_by": created_by})

        # Log audit
        if generated_keys:
            await self.log_audit(
                action="CREATE",
                entity_type="LICENSE",
                entity_id=license_ids[0] if len(license_ids) == 1 else "BULK",
                actor_email=created_by or self._admin_email,
                actor_ip=actor_ip or "unknown",
                details={
                    "tier": tier,
                    "email": email,
                    "quantity": quantity,
                    "keys_created": len(generated_keys),
                    "notes": notes,
                },
            )

        return {
            "keys": generated_keys,
            "license_ids": license_ids,
            "tier": tier,
            "quantity": len(generated_keys),
        }

    async def revoke_license(
        self,
        key_id: str,
        reason: str,
        revoked_by: Optional[str] = None,
        actor_ip: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Revoke a license key.

        Args:
            key_id: The key_id to revoke
            reason: Reason for revocation
            revoked_by: Admin email who revoked
            actor_ip: IP address of the admin
            notes: Optional notes

        Returns:
            Dict with success status and details
        """
        # Check if exists
        license_info = await self._repo.get_license_by_key_id(key_id)
        if not license_info:
            return {"success": False, "error": "License not found"}

        # Revoke
        success = await self._repo.revoke_license(
            key_id,
            reason,
            revoked_by or self._admin_email,
        )

        if success:
            # Log audit
            await self.log_audit(
                action="REVOKE",
                entity_type="LICENSE",
                entity_id=key_id,
                actor_email=revoked_by or self._admin_email,
                actor_ip=actor_ip or "unknown",
                details={
                    "reason": reason,
                    "notes": notes,
                    "email": license_info.get("email"),
                    "tier": license_info.get("tier"),
                },
            )

        return {
            "success": success,
            "key_id": key_id,
            "revoked_at": datetime.now().isoformat(),
        }

    async def list_licenses(
        self,
        page: int = 1,
        page_size: int = 20,
        tier: Optional[str] = None,
        status: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List all licenses with pagination and filters.

        Args:
            page: Page number (1-indexed)
            page_size: Items per page
            tier: Filter by tier
            status: Filter by status
            email: Filter by email

        Returns:
            Dict with items, total, page, page_size, total_pages
        """
        # Build query
        where_clauses = ["1=1"]
        params = []
        param_count = 1

        if tier:
            where_clauses.append(f"tier = ${param_count}")
            params.append(tier)
            param_count += 1

        if status:
            where_clauses.append(f"status = ${param_count}")
            params.append(status)
            param_count += 1

        if email:
            where_clauses.append(f"email ILIKE ${param_count}")
            params.append(f"%{email}%")
            param_count += 1

        where_sql = " AND ".join(where_clauses)
        offset = (page - 1) * page_size

        # Get items
        query = f"""
            SELECT * FROM licenses
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ${param_count} OFFSET ${param_count + 1}
        """
        params.extend([page_size, offset])

        db = self._repo._db
        rows = await db.fetch_all(query, tuple(params))
        items = [dict(row) for row in rows]

        # Get total count
        count_query = f"""
            SELECT COUNT(*) as total FROM licenses WHERE {where_sql}
        """
        count_result = await db.fetch_one(count_query, tuple(params[:-2]))
        total = count_result["total"] if count_result else 0

        # Mask keys for security
        for item in items:
            key = item.get("license_key", "")
            if len(key) > 16:
                item["license_key"] = f"{key[:12]}***{key[-4:]}"

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }

    async def get_audit_logs(
        self,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        actor_email: Optional[str] = None,
        days: int = 30,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get audit logs with filters.

        Args:
            action: Filter by action (CREATE, REVOKE, etc.)
            entity_type: Filter by entity type
            actor_email: Filter by actor email
            days: Last N days
            limit: Max results

        Returns:
            List of audit log entries
        """
        where_clauses = ["created_at >= CURRENT_DATE - INTERVAL '%s days'" % days]
        params = []
        param_count = 1

        if action:
            where_clauses.append(f"action = ${param_count}")
            params.append(action)
            param_count += 1

        if entity_type:
            where_clauses.append(f"entity_type = ${param_count}")
            params.append(entity_type)
            param_count += 1

        if actor_email:
            where_clauses.append(f"actor_email ILIKE ${param_count}")
            params.append(f"%{actor_email}%")
            param_count += 1

        where_sql = " AND ".join(where_clauses)

        query = f"""
            SELECT * FROM audit_logs
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT ${param_count}
        """
        params.append(limit)

        db = self._repo._db
        rows = await db.fetch_all(query, tuple(params))
        return [dict(row) for row in rows]

    async def log_audit(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        actor_email: str,
        actor_ip: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Log an audit entry.

        Args:
            action: Action performed (CREATE, REVOKE, UPDATE, VIEW)
            entity_type: Type of entity (LICENSE, KEY, USER)
            entity_id: Entity identifier
            actor_email: Who performed the action
            actor_ip: IP address of actor
            details: Additional details

        Returns:
            Created audit log entry
        """
        db = self._repo._db
        query = """
            INSERT INTO audit_logs (action, entity_type, entity_id, actor_email, actor_ip, details)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """
        result = await db.fetch_one(
            query,
            (action, entity_type, entity_id, actor_email, actor_ip, details or {}),
        )
        return dict(result) if result else {}

    def _get_tier_limit(self, tier: str) -> int:
        """Get daily command limit for tier."""
        limits = {
            "free": 100,
            "trial": 1000,
            "pro": 10000,
            "enterprise": -1,  # Unlimited
        }
        return limits.get(tier, 100)


# Singleton instance
_service: Optional[AdminLicenseService] = None


def get_admin_service() -> AdminLicenseService:
    """Get singleton admin service instance."""
    global _service
    if _service is None:
        _service = AdminLicenseService()
    return _service


__all__ = ["AdminLicenseService", "get_admin_service"]
