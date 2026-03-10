"""
Activation Sync — Dashboard Webhook Bridge

Syncs license activation events to AgencyOS dashboard for real-time state display.
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from .raas_auth import RaaSAuthClient


class ActivationSync:
    """
    Dashboard Sync Webhook Bridge.

    Syncs activation metadata to AgencyOS dashboard:
    - agencyId
    - planTier
    - tenantId
    - activationTimestamp

    Implements:
    - Async retry queue for failed syncs
    - Idempotency keys to prevent duplicate events
    - Webhook signature for security
    """

    DASHBOARD_URL = os.getenv(
        "AGENCYOS_DASHBOARD_URL",
        "https://agencyos.network"
    )
    SYNC_ENDPOINT = "/api/v1/dashboard/sync"
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # seconds

    def __init__(self, auth_client: Optional[RaaSAuthClient] = None):
        """Initialize activation sync."""
        self.auth = auth_client or RaaSAuthClient()
        self._session = requests.Session()
        self._queue_file = Path.home() / ".mekong" / "sync_queue.json"
        self._ensure_mekong_dir()

    def _ensure_mekong_dir(self) -> None:
        """Ensure ~/.mekong directory exists."""
        self._queue_file.parent.mkdir(parents=True, exist_ok=True)

    def sync_activation(
        self,
        tenant_id: str,
        agency_id: str,
        tier: str,
        license_key: Optional[str] = None,
        features: Optional[list[str]] = None,
    ) -> bool:
        """
        Sync license activation to dashboard.

        Args:
            tenant_id: Tenant identifier from gateway
            agency_id: Agency identifier for dashboard
            tier: Plan tier (free/trial/pro/enterprise)
            license_key: Masked license key (optional)
            features: List of enabled features (optional)

        Returns:
            True if sync succeeded or queued, False if failed
        """
        event = {
            "event_type": "license_activated",
            "tenant_id": tenant_id,
            "agency_id": agency_id,
            "tier": tier,
            "license_key": self._mask_key(license_key) if license_key else None,
            "features": features or [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "idempotency_key": self._generate_idempotency_key(tenant_id, agency_id),
        }

        # Try immediate sync
        success = self._send_event(event)

        if not success:
            # Queue for retry
            self._queue_event(event)
            return True  # Queued is considered success for UX

        return True

    def _send_event(self, event: Dict[str, Any]) -> bool:
        """Send event to dashboard synchronously."""
        url = f"{self.DASHBOARD_URL}{self.SYNC_ENDPOINT}"

        try:
            # Get session for auth headers
            session = self.auth.get_session()

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "mekong-cli/0.2.0",
            }

            # Add auth header if available
            if session.authenticated and session.tenant:
                # Use license key as bearer token
                if session.tenant.license_key:
                    headers["Authorization"] = f"Bearer {session.tenant.license_key}"

            # Add webhook signature for security
            headers["X-Webhook-Signature"] = self._generate_signature(event)

            response = self._session.post(
                url,
                json=event,
                headers=headers,
                timeout=10,
            )

            if response.status_code in (200, 201, 204):
                return True

            # Log failure for retry
            print(f"Dashboard sync failed: {response.status_code}")
            return False

        except requests.exceptions.RequestException as e:
            print(f"Dashboard sync error: {e}")
            return False

    def _queue_event(self, event: Dict[str, Any]) -> None:
        """Queue event for retry."""
        queue = self._load_queue()
        queue["events"].append({
            "event": event,
            "queued_at": datetime.now(timezone.utc).isoformat(),
            "retries": 0,
        })
        self._save_queue(queue)

    def _load_queue(self) -> Dict[str, Any]:
        """Load sync queue from file."""
        if self._queue_file.exists():
            try:
                with open(self._queue_file, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {"events": []}

    def _save_queue(self, queue: Dict[str, Any]) -> None:
        """Save sync queue to file."""
        with open(self._queue_file, "w") as f:
            json.dump(queue, f, indent=2)

    def _generate_idempotency_key(self, tenant_id: str, agency_id: str) -> str:
        """Generate idempotency key to prevent duplicate events."""
        import hashlib
        data = f"{tenant_id}:{agency_id}:{int(time.time() / 3600)}"  # Hourly granularity
        return hashlib.sha256(data.encode()).hexdigest()[:32]

    def _generate_signature(self, event: Dict[str, Any]) -> str:
        """Generate webhook signature for security."""
        import hmac
        import hashlib

        # Use a shared secret (in production, this would be configured)
        secret = os.getenv("DASHBOARD_WEBHOOK_SECRET", "mekong-webhook-secret")
        payload = json.dumps(event, sort_keys=True)
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"

    def _mask_key(self, license_key: str) -> str:
        """Mask license key for display."""
        if len(license_key) > 12:
            return f"{license_key[:8]}...{license_key[-4:]}"
        return "(hidden)"

    def process_queue(self) -> int:
        """
        Process queued sync events.

        Returns:
            Number of events processed successfully
        """
        queue = self._load_queue()
        processed = 0

        remaining_events = []
        for item in queue["events"]:
            if item["retries"] >= self.MAX_RETRIES:
                # Give up after max retries
                continue

            success = self._send_event(item["event"])
            if success:
                processed += 1
            else:
                item["retries"] += 1
                remaining_events.append(item)

        queue["events"] = remaining_events
        self._save_queue(queue)

        return processed


# Singleton instance
_sync_instance: Optional[ActivationSync] = None


def get_activation_sync() -> ActivationSync:
    """Get or create ActivationSync singleton."""
    global _sync_instance
    if _sync_instance is None:
        _sync_instance = ActivationSync()
    return _sync_instance
