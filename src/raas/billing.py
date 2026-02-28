"""Polar.sh webhook handler for RaaS credit provisioning.

Verifies webhook signatures, enforces idempotency, and provisions
credits to tenant accounts based on Polar product purchases.
"""

import hashlib
import hmac
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from src.raas.credits import CreditStore

DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

# Maps Polar product IDs to credit amounts granted on purchase.
# Override at runtime via environment / config as needed.
POLAR_PRODUCT_MAP: dict[str, int] = {
    "starter_monthly": 50,
    "growth_monthly": 200,
    "pro_monthly": 500,
    "enterprise_monthly": 2000,
    "credits_10": 10,
    "credits_50": 50,
    "credits_100": 100,
}

billing_router = APIRouter(tags=["billing"])


class PolarWebhookHandler:
    """Handles incoming Polar.sh webhook events.

    Responsibilities:
    - Verify HMAC SHA-256 signatures from Polar.
    - Enforce idempotency via SQLite event-log table.
    - Map product purchases to tenant credit provisioning.
    """

    def __init__(
        self,
        credit_store: CreditStore | None = None,
        db_path: Path = DB_PATH,
    ) -> None:
        """Initialize with an optional CreditStore and DB path."""
        self.credit_store = credit_store or CreditStore(db_path)
        self.db_path = db_path
        self._init_db()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        """Return a configured SQLite connection."""
        conn = sqlite3.connect(str(self.db_path), timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Create processed_events table if it does not exist."""
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS processed_events (
                        event_id     TEXT PRIMARY KEY,
                        processed_at TEXT NOT NULL
                    )
                    """
                )
        except sqlite3.Error as exc:
            raise RuntimeError(
                f"PolarWebhookHandler: failed to initialize DB: {exc}"
            ) from exc

    @staticmethod
    def _now_iso() -> str:
        """Return current UTC time as ISO 8601 string."""
        return datetime.now(timezone.utc).isoformat()

    def _is_duplicate(self, event_id: str) -> bool:
        """Return True if the event has already been processed."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT event_id FROM processed_events WHERE event_id = ?",
                    (event_id,),
                ).fetchone()
                return row is not None
        except sqlite3.Error as exc:
            raise RuntimeError(f"Idempotency check failed: {exc}") from exc

    def _mark_processed(self, event_id: str) -> None:
        """Record an event as processed to prevent reprocessing."""
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO processed_events (event_id, processed_at) "
                    "VALUES (?, ?)",
                    (event_id, self._now_iso()),
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to mark event processed: {exc}") from exc

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def verify_signature(
        self, payload: bytes, signature: str, secret: str
    ) -> bool:
        """Verify a Polar webhook HMAC-SHA256 signature.

        Args:
            payload: Raw request body bytes.
            signature: Value of the `webhook-signature` header from Polar.
            secret: Webhook secret configured in the Polar dashboard.

        Returns:
            True if the signature is valid, False otherwise.
        """
        expected = hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        # Polar sends signature as "sha256=<hex>"; strip prefix if present.
        sig = signature.removeprefix("sha256=")
        return hmac.compare_digest(expected, sig)

    def provision_credits(self, tenant_id: str, product_id: str) -> int:
        """Map a Polar product to a credit amount and add to tenant account.

        Args:
            tenant_id: Tenant identifier extracted from the webhook payload.
            product_id: Polar product ID from the purchase event.

        Returns:
            New credit balance after provisioning.

        Raises:
            ValueError: If the product_id is not in POLAR_PRODUCT_MAP.
        """
        amount = POLAR_PRODUCT_MAP.get(product_id)
        if amount is None:
            raise ValueError(
                f"Unknown product_id '{product_id}'. "
                f"Known products: {list(POLAR_PRODUCT_MAP)}"
            )
        reason = f"Polar purchase: {product_id}"
        return self.credit_store.add(tenant_id, amount, reason)

    def handle_event(self, event_data: dict) -> dict:
        """Route an incoming Polar event to the appropriate handler.

        Supported event types:
        - ``order.created`` / ``subscription.created``: provision credits.
        - Others: acknowledged but not acted upon.

        Args:
            event_data: Parsed JSON body from the Polar webhook.

        Returns:
            Dict with ``status`` and relevant metadata.
        """
        event_type = event_data.get("type", "")
        event_id = event_data.get("id", "")

        if not event_id:
            return {"status": "ignored", "reason": "missing event id"}

        if self._is_duplicate(event_id):
            return {"status": "duplicate", "event_id": event_id}

        result: dict = {"status": "ok", "event_id": event_id, "type": event_type}

        try:
            if event_type in ("order.created", "subscription.created"):
                data = event_data.get("data", {})
                tenant_id = (
                    data.get("customer", {}).get("external_id")
                    or data.get("metadata", {}).get("tenant_id")
                    or data.get("customer_id", "")
                )
                product_id = (
                    data.get("product", {}).get("id")
                    or data.get("product_id", "")
                )
                if not tenant_id or not product_id:
                    result["status"] = "error"
                    result["reason"] = "missing tenant_id or product_id"
                else:
                    new_balance = self.provision_credits(tenant_id, product_id)
                    result["tenant_id"] = tenant_id
                    result["product_id"] = product_id
                    result["new_balance"] = new_balance
            else:
                result["status"] = "acknowledged"
        except (ValueError, RuntimeError) as exc:
            result["status"] = "error"
            result["reason"] = str(exc)
        else:
            # Only mark processed when no exception occurred
            self._mark_processed(event_id)

        return result


# ---------------------------------------------------------------------------
# Module-level handler instance (lazy singleton via dependency injection)
# ---------------------------------------------------------------------------

_handler: PolarWebhookHandler | None = None


def _get_handler() -> PolarWebhookHandler:
    """Return or create the module-level PolarWebhookHandler singleton."""
    global _handler
    if _handler is None:
        _handler = PolarWebhookHandler()
    return _handler


# ---------------------------------------------------------------------------
# FastAPI route
# ---------------------------------------------------------------------------

@billing_router.post("/billing/webhook")
async def polar_webhook(request: Request) -> dict:
    """Receive and process a Polar.sh webhook event.

    - Verifies HMAC-SHA256 signature.
    - Enforces idempotency.
    - Provisions credits on successful purchase events.

    Raises:
        HTTPException 401: If signature verification fails.
        HTTPException 400: If the payload cannot be decoded.
    """
    import os

    webhook_secret = os.getenv("POLAR_WEBHOOK_SECRET", "")
    signature = request.headers.get("webhook-signature", "")

    try:
        payload = await request.body()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read body: {exc}") from exc

    if webhook_secret:
        handler = _get_handler()
        if not handler.verify_signature(payload, signature, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        event_data = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}") from exc

    handler = _get_handler()
    result = handler.handle_event(event_data)
    return result
