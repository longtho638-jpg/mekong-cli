"""Polar webhook handler for subscription events (workspace-level billing)."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import sqlite3

# Import for integration - must be at module level
from src.raas.credit_account_repository import CreditAccountRepository
from src.raas.quota_checker_service import QuotaCheckerService

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "workspaces.db"

# Polar.sh event types
POLAR_EVENT_TYPES = {
    "order.created",
    "subscription.created",
    "subscription.updated",
    "subscription.cancelled",
    "subscription.active",
    "subscription.inactive",
}

# Product ID to credit mapping (configure per deployment)
PRODUCT_CREDITS: dict[str, int] = {
    "starter": 200,
    "growth": 1000,
    "pro": 5000,
    "enterprise": 10000,
}

# Product ID to tier mapping
PRODUCT_TIER: dict[str, str] = {
    "starter": "starter",
    "growth": "growth",
    "pro": "pro",
    "enterprise": "enterprise",
}


@dataclass
class PolarSubscription:
    """Represents a Polar.sh subscription."""

    workspace_id: str
    polar_subscription_id: str
    product_id: str
    tier: str
    status: str  # active/inactive/cancelled
    credits_granted: int = 0
    created_at: str = ""
    updated_at: str = ""
    metadata: dict = field(default_factory=dict)


class PolarSubscriptionRepository:
    """SQLite repository for Polar subscriptions."""

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Open WAL-mode connection."""
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        """Create polar_subscriptions table."""
        try:
            with self._connect() as conn:
                conn.executescript("""
                -- Polar subscriptions
                CREATE TABLE IF NOT EXISTS polar_subscriptions (
                    workspace_id           TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
                    polar_subscription_id  TEXT NOT NULL UNIQUE,
                    product_id             TEXT NOT NULL,
                    tier                   TEXT NOT NULL,
                    status                 TEXT NOT NULL,
                    credits_granted        INTEGER NOT NULL DEFAULT 0,
                    created_at             TEXT NOT NULL,
                    updated_at             TEXT NOT NULL,
                    metadata               TEXT DEFAULT '{}'
                );

                -- Index for subscription lookups
                CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_status ON polar_subscriptions(status);
                """)
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize Polar subscriptions DB: {exc}") from exc

    @staticmethod
    def _now_iso() -> str:
        """Return current UTC time as ISO 8601 string."""
        return datetime.now(timezone.utc).isoformat()

    def save_subscription(self, subscription: PolarSubscription) -> bool:
        """Save or update a Polar subscription."""
        now = self._now_iso()
        meta_json = json.dumps(subscription.metadata)

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO polar_subscriptions
                    (workspace_id, polar_subscription_id, product_id, tier, status, credits_granted, created_at, updated_at, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(workspace_id) DO UPDATE SET
                        polar_subscription_id = excluded.polar_subscription_id,
                        product_id = excluded.product_id,
                        tier = excluded.tier,
                        status = excluded.status,
                        credits_granted = excluded.credits_granted,
                        updated_at = excluded.updated_at,
                        metadata = excluded.metadata
                    """,
                    (
                        subscription.workspace_id,
                        subscription.polar_subscription_id,
                        subscription.product_id,
                        subscription.tier,
                        subscription.status,
                        subscription.credits_granted,
                        subscription.created_at or now,
                        subscription.updated_at or now,
                        meta_json,
                    ),
                )
                conn.commit()
                return True
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to save Polar subscription: {exc}") from exc

    def get_subscription(self, workspace_id: str) -> Optional[PolarSubscription]:
        """Get subscription for a workspace."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM polar_subscriptions WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()

                if not row:
                    return None

                return PolarSubscription(
                    workspace_id=row["workspace_id"],
                    polar_subscription_id=row["polar_subscription_id"],
                    product_id=row["product_id"],
                    tier=row["tier"],
                    status=row["status"],
                    credits_granted=int(row["credits_granted"]),
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    metadata=json.loads(row["metadata"] or "{}"),
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get Polar subscription: {exc}") from exc


class PolarWebhookHandler:
    """
    Handler for Polar.sh webhook events.

    Usage:
        handler = PolarWebhookHandler(webhook_secret="whsec_...")
        if handler.verify_signature(payload, signature):
            handler.handle_event(event_data)
    """

    def __init__(
        self,
        webhook_secret: str | None = None,
        db_path: Path = _DB_PATH,
    ) -> None:
        self._webhook_secret = webhook_secret or os.environ.get("POLAR_WEBHOOK_SECRET", "")
        if not self._webhook_secret:
            logger.warning("POLAR_WEBHOOK_SECRET not set - webhook verification disabled")

        self._credit_repo = CreditAccountRepository(db_path)
        self._quota_service = QuotaCheckerService(db_path)
        self._subscription_repo = PolarSubscriptionRepository(db_path)

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify HMAC-SHA256 webhook signature.

        Args:
            payload: Raw request body bytes
            signature: Signature from Polar-Signature header

        Returns:
            True if signature is valid
        """
        if not self._webhook_secret:
            logger.warning("Skipping signature verification (no secret configured)")
            return True  # Allow in dev mode

        try:
            expected = hmac.new(
                self._webhook_secret.encode(),
                payload,
                hashlib.sha256,
            ).hexdigest()

            return hmac.compare_digest(expected, signature)
        except Exception as exc:
            logger.error(f"Signature verification failed: {exc}")
            return False

    def handle_event(self, event_data: dict) -> bool:
        """
        Handle a Polar webhook event.

        Args:
            event_data: Parsed JSON event data

        Returns:
            True if handled successfully
        """
        event_id = event_data.get("id", "")
        event_type = event_data.get("type", "")
        event_data_payload = event_data.get("data", {})

        # Idempotency check
        if self._credit_repo.is_event_processed(event_id):
            logger.info(f"Event {event_id} already processed (duplicate)")
            return True

        # Route by event type
        try:
            if event_type == "order.created":
                return self._handle_order_created(event_id, event_data_payload)
            elif event_type in {"subscription.created", "subscription.active"}:
                return self._handle_subscription_created(event_id, event_data_payload)
            elif event_type == "subscription.updated":
                return self._handle_subscription_updated(event_id, event_data_payload)
            elif event_type in {"subscription.cancelled", "subscription.inactive"}:
                return self._handle_subscription_cancelled(event_id, event_data_payload)
            else:
                logger.warning(f"Unhandled event type: {event_type}")
                return True  # Unknown event types are OK

        except Exception as exc:
            logger.error(f"Failed to handle event {event_id}: {exc}")
            return False

    def _extract_workspace_id(self, event_data: dict) -> str:
        """Extract workspace ID from event metadata."""
        # Polar metadata structure
        metadata = event_data.get("metadata", {})
        workspace_id = metadata.get("workspace_id") or metadata.get("workspaceId")

        if not workspace_id:
            # Fallback: try to get from custom_field_data
            custom_fields = event_data.get("custom_field_data", {})
            workspace_id = custom_fields.get("workspace_id")

        if not workspace_id:
            raise ValueError("workspace_id not found in event metadata")

        return workspace_id

    def _handle_order_created(self, event_id: str, event_data: dict) -> bool:
        """Handle one-time order.created event."""
        workspace_id = self._extract_workspace_id(event_data)

        # Get product ID from order
        product_id = event_data.get("product_id", "")
        if not product_id:
            # Try nested structure
            order_data = event_data.get("order", event_data)
            product_id = order_data.get("product_id", "")

        # Map product to credits
        credits = PRODUCT_CREDITS.get(product_id, 0)
        tier = PRODUCT_TIER.get(product_id, "free")

        if credits == 0:
            logger.warning(f"Unknown product_id: {product_id}, no credits granted")
            return True

        # Provision credits
        self._credit_repo.add_credits(
            workspace_id=workspace_id,
            amount=credits,
            reason=f"Polar order: {product_id}",
            metadata={"event_id": event_id, "product_id": product_id},
        )

        # Update tier
        self._quota_service.update_tier(workspace_id, tier)

        # Mark processed
        self._credit_repo.mark_event_processed(event_id, "order.created", workspace_id)

        logger.info(f"Provisioned {credits} credits to {workspace_id} (tier: {tier})")
        return True

    def _handle_subscription_created(self, event_id: str, event_data: dict) -> bool:
        """Handle subscription.created event."""
        workspace_id = self._extract_workspace_id(event_data)

        # Get subscription details
        subscription_id = event_data.get("id", "")
        product_id = event_data.get("product_id", "")
        if not product_id:
            sub_data = event_data.get("subscription", event_data)
            product_id = sub_data.get("product_id", "")

        credits = PRODUCT_CREDITS.get(product_id, 0)
        tier = PRODUCT_TIER.get(product_id, "free")

        # Provision credits
        self._credit_repo.add_credits(
            workspace_id=workspace_id,
            amount=credits,
            reason=f"Polar subscription: {product_id}",
            metadata={"event_id": event_id, "subscription_id": subscription_id},
        )

        # Update tier
        self._quota_service.update_tier(workspace_id, tier)

        # Save subscription record
        self._subscription_repo.save_subscription(
            PolarSubscription(
                workspace_id=workspace_id,
                polar_subscription_id=subscription_id,
                product_id=product_id,
                tier=tier,
                status="active",
                credits_granted=credits,
            )
        )

        # Mark processed
        self._credit_repo.mark_event_processed(event_id, "subscription.created", workspace_id)

        logger.info(f"Subscription created: {credits} credits to {workspace_id} (tier: {tier})")
        return True

    def _handle_subscription_updated(self, event_id: str, event_data: dict) -> bool:
        """Handle subscription.updated event (tier change)."""
        workspace_id = self._extract_workspace_id(event_data)

        # Get updated subscription details
        product_id = event_data.get("product_id", "")
        if not product_id:
            sub_data = event_data.get("subscription", event_data)
            product_id = sub_data.get("product_id", "")

        new_tier = PRODUCT_TIER.get(product_id, "free")

        # Update tier (credits handled by recurring billing)
        self._quota_service.update_tier(workspace_id, new_tier)

        # Update subscription record
        existing = self._subscription_repo.get_subscription(workspace_id)
        if existing:
            existing.tier = new_tier
            existing.updated_at = self._credit_repo._now_iso()
            self._subscription_repo.save_subscription(existing)

        # Mark processed
        self._credit_repo.mark_event_processed(event_id, "subscription.updated", workspace_id)

        logger.info(f"Subscription updated: {workspace_id} -> tier {new_tier}")
        return True

    def _handle_subscription_cancelled(self, event_id: str, event_data: dict) -> bool:
        """Handle subscription.cancelled event (downgrade to free)."""
        workspace_id = self._extract_workspace_id(event_data)

        # Downgrade to free tier
        self._quota_service.update_tier(workspace_id, "free")

        # Update subscription record
        existing = self._subscription_repo.get_subscription(workspace_id)
        if existing:
            existing.status = "cancelled"
            existing.updated_at = self._credit_repo._now_iso()
            self._subscription_repo.save_subscription(existing)

        # Mark processed
        self._credit_repo.mark_event_processed(event_id, "subscription.cancelled", workspace_id)

        logger.info(f"Subscription cancelled: {workspace_id} -> tier free")
        return True
