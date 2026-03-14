"""Billing alert service for workspace usage notifications (SQLite version)."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import json

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "workspaces.db"


@dataclass
class BillingAlert:
    """Represents a billing alert."""

    id: str
    workspace_id: str
    alert_type: str  # warning/critical/exhausted/low_credits
    threshold_pct: int
    current_pct: float
    triggered_at: str
    is_read: bool = False
    metadata: dict = field(default_factory=dict)


@dataclass
class AlertConfig:
    """Alert threshold configuration per tier."""

    warning_pct: int = 80
    critical_pct: int = 90
    exhausted_pct: int = 100
    low_credit_threshold: int = 10


# Tier-specific alert configurations
TIER_ALERT_CONFIGS: dict[str, AlertConfig] = {
    "free": AlertConfig(warning_pct=80, critical_pct=90, exhausted_pct=100),
    "starter": AlertConfig(warning_pct=80, critical_pct=90, exhausted_pct=100),
    "growth": AlertConfig(warning_pct=75, critical_pct=85, exhausted_pct=100),
    "pro": AlertConfig(warning_pct=70, critical_pct=85, exhausted_pct=100),
    "enterprise": AlertConfig(warning_pct=50, critical_pct=75, exhausted_pct=100),
}


class BillingAlertService:
    """
    SQLite service for proactive billing alerts.

    Usage:
        service = BillingAlertService()
        service.check_and_alert(workspace_id, usage_pct=85, credits_remaining=5)
        alerts = service.get_alerts(workspace_id)
        service.mark_read(alert_id)
    """

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
        """Create billing_alerts table if it doesn't exist."""
        try:
            with self._connect() as conn:
                conn.executescript("""
                -- Billing alerts
                CREATE TABLE IF NOT EXISTS billing_alerts (
                    id              TEXT PRIMARY KEY,
                    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                    alert_type      TEXT NOT NULL,
                    threshold_pct   INTEGER NOT NULL,
                    current_pct     REAL NOT NULL,
                    triggered_at    TEXT NOT NULL,
                    is_read         INTEGER DEFAULT 0,
                    metadata        TEXT DEFAULT '{}',
                    billing_cycle   TEXT NOT NULL
                );

                -- Alert tracking (which thresholds fired per cycle)
                CREATE TABLE IF NOT EXISTS alert_tracking (
                    workspace_id    TEXT NOT NULL,
                    billing_cycle   TEXT NOT NULL,
                    warning_fired   INTEGER DEFAULT 0,
                    critical_fired  INTEGER DEFAULT 0,
                    exhausted_fired INTEGER DEFAULT 0,
                    updated_at      TEXT NOT NULL,
                    PRIMARY KEY (workspace_id, billing_cycle)
                );

                -- Indexes
                CREATE INDEX IF NOT EXISTS idx_billing_alerts_workspace ON billing_alerts(workspace_id);
                CREATE INDEX IF NOT EXISTS idx_billing_alerts_unread ON billing_alerts(workspace_id, is_read);
                """)
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize alert DB: {exc}") from exc

    @staticmethod
    def _now_iso() -> str:
        """Return current UTC time as ISO 8601 string."""
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _billing_cycle() -> str:
        """Return current billing cycle (YYYY-MM)."""
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def _get_config(self, tier: str) -> AlertConfig:
        """Get alert configuration for a tier."""
        return TIER_ALERT_CONFIGS.get(tier, TIER_ALERT_CONFIGS["free"])

    def _get_tracking(self, workspace_id: str, cycle: str) -> dict:
        """Get alert tracking state for workspace/cycle."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM alert_tracking WHERE workspace_id = ? AND billing_cycle = ?",
                    (workspace_id, cycle),
                ).fetchone()

                if row:
                    return {
                        "warning_fired": bool(row["warning_fired"]),
                        "critical_fired": bool(row["critical_fired"]),
                        "exhausted_fired": bool(row["exhausted_fired"]),
                    }

                return {"warning_fired": False, "critical_fired": False, "exhausted_fired": False}
        except sqlite3.Error as exc:
            logger.warning(f"Failed to get tracking: {exc}")
            return {"warning_fired": False, "critical_fired": False, "exhausted_fired": False}

    def _update_tracking(
        self,
        workspace_id: str,
        cycle: str,
        **kwargs: bool,
    ) -> None:
        """Update alert tracking state."""
        now = self._now_iso()

        try:
            with self._connect() as conn:
                # Check if exists
                row = conn.execute(
                    "SELECT 1 FROM alert_tracking WHERE workspace_id = ? AND billing_cycle = ?",
                    (workspace_id, cycle),
                ).fetchone()

                if row:
                    set_clauses = []
                    values = []
                    for key, value in kwargs.items():
                        set_clauses.append(f"{key} = ?")
                        values.append(1 if value else 0)
                    set_clauses.append("updated_at = ?")
                    values.append(now)
                    values.append(workspace_id)
                    values.append(cycle)

                    conn.execute(
                        f"UPDATE alert_tracking SET {', '.join(set_clauses)} WHERE workspace_id = ? AND billing_cycle = ?",
                        values,
                    )
                else:
                    conn.execute(
                        """
                        INSERT INTO alert_tracking
                        (workspace_id, billing_cycle, warning_fired, critical_fired, exhausted_fired, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            workspace_id,
                            cycle,
                            1 if kwargs.get("warning_fired") else 0,
                            1 if kwargs.get("critical_fired") else 0,
                            1 if kwargs.get("exhausted_fired") else 0,
                            now,
                        ),
                    )
                conn.commit()
        except sqlite3.Error as exc:
            logger.warning(f"Failed to update tracking: {exc}")

    def check_and_alert(
        self,
        workspace_id: str,
        usage_pct: float,
        credits_remaining: int,
        tier: str = "free",
    ) -> list[BillingAlert]:
        """
        Check quota/credits and fire alerts if thresholds crossed.

        Args:
            workspace_id: Target workspace
            usage_pct: Current usage percentage (0-100)
            credits_remaining: Current credit balance
            tier: Workspace tier for threshold config

        Returns:
            List of newly fired alerts (empty if no new alerts)
        """
        config = self._get_config(tier)
        cycle = self._billing_cycle()
        tracking = self._get_tracking(workspace_id, cycle)
        fired_alerts = []

        # Check usage thresholds
        if usage_pct >= config.exhausted_pct and not tracking["exhausted_fired"]:
            alert = self._create_alert(
                workspace_id=workspace_id,
                alert_type="exhausted",
                threshold_pct=config.exhausted_pct,
                current_pct=usage_pct,
                metadata={"tier": tier, "message": "Quota exhausted"},
            )
            fired_alerts.append(alert)
            self._update_tracking(workspace_id, cycle, exhausted_fired=True)

        elif usage_pct >= config.critical_pct and not tracking["critical_fired"]:
            alert = self._create_alert(
                workspace_id=workspace_id,
                alert_type="critical",
                threshold_pct=config.critical_pct,
                current_pct=usage_pct,
                metadata={"tier": tier, "message": "Critical: approaching quota limit"},
            )
            fired_alerts.append(alert)
            self._update_tracking(workspace_id, cycle, critical_fired=True)

        elif usage_pct >= config.warning_pct and not tracking["warning_fired"]:
            alert = self._create_alert(
                workspace_id=workspace_id,
                alert_type="warning",
                threshold_pct=config.warning_pct,
                current_pct=usage_pct,
                metadata={"tier": tier, "message": "Warning: approaching quota limit"},
            )
            fired_alerts.append(alert)
            self._update_tracking(workspace_id, cycle, warning_fired=True)

        # Check low credits
        if credits_remaining <= config.low_credit_threshold:
            # Don't track low credits - can fire multiple times
            alert = self._create_alert(
                workspace_id=workspace_id,
                alert_type="low_credits",
                threshold_pct=config.low_credit_threshold,
                current_pct=0,
                metadata={"credits_remaining": credits_remaining, "message": "Low credit balance"},
            )
            fired_alerts.append(alert)

        # Log alerts
        for alert in fired_alerts:
            logger.info(f"[BillingAlert] {alert.alert_type} for {workspace_id}: {alert.metadata}")

        return fired_alerts

    def _create_alert(
        self,
        workspace_id: str,
        alert_type: str,
        threshold_pct: int,
        current_pct: float,
        metadata: dict,
    ) -> BillingAlert:
        """Create and persist a billing alert."""
        import uuid

        alert_id = str(uuid.uuid4())[:8]
        now = self._now_iso()
        cycle = self._billing_cycle()
        meta_json = json.dumps(metadata)

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO billing_alerts
                    (id, workspace_id, alert_type, threshold_pct, current_pct, triggered_at, is_read, metadata, billing_cycle)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
                    """,
                    (alert_id, workspace_id, alert_type, threshold_pct, current_pct, now, meta_json, cycle),
                )
                conn.commit()
        except sqlite3.Error as exc:
            logger.warning(f"Failed to create alert: {exc}")

        return BillingAlert(
            id=alert_id,
            workspace_id=workspace_id,
            alert_type=alert_type,
            threshold_pct=threshold_pct,
            current_pct=current_pct,
            triggered_at=now,
            is_read=False,
            metadata=metadata,
        )

    def get_alerts(self, workspace_id: str, unread_only: bool = True) -> list[BillingAlert]:
        """
        Get alerts for a workspace.

        Args:
            workspace_id: Target workspace
            unread_only: If True, only return unread alerts

        Returns:
            List of alerts ordered by triggered_at DESC
        """
        try:
            with self._connect() as conn:
                if unread_only:
                    rows = conn.execute(
                        """
                        SELECT * FROM billing_alerts
                        WHERE workspace_id = ? AND is_read = 0
                        ORDER BY triggered_at DESC
                        """,
                        (workspace_id,),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT * FROM billing_alerts
                        WHERE workspace_id = ?
                        ORDER BY triggered_at DESC
                        """,
                        (workspace_id,),
                    ).fetchall()

                return [self._row_to_alert(row) for row in rows]
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get alerts: {exc}") from exc

    def mark_read(self, alert_id: str) -> bool:
        """Mark an alert as read."""
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    "UPDATE billing_alerts SET is_read = 1 WHERE id = ?",
                    (alert_id,),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to mark alert read: {exc}") from exc

    def get_alert_history(
        self,
        workspace_id: str,
        cycle: str | None = None,
    ) -> list[BillingAlert]:
        """
        Get full alert history for audit.

        Args:
            workspace_id: Target workspace
            cycle: Optional billing cycle filter (YYYY-MM)

        Returns:
            List of all alerts (read and unread)
        """
        try:
            with self._connect() as conn:
                if cycle:
                    rows = conn.execute(
                        """
                        SELECT * FROM billing_alerts
                        WHERE workspace_id = ? AND billing_cycle = ?
                        ORDER BY triggered_at DESC
                        """,
                        (workspace_id, cycle),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT * FROM billing_alerts
                        WHERE workspace_id = ?
                        ORDER BY triggered_at DESC
                        """,
                        (workspace_id,),
                    ).fetchall()

                return [self._row_to_alert(row) for row in rows]
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get alert history: {exc}") from exc

    def _row_to_alert(self, row: sqlite3.Row) -> BillingAlert:
        """Convert DB row to BillingAlert."""
        return BillingAlert(
            id=row["id"],
            workspace_id=row["workspace_id"],
            alert_type=row["alert_type"],
            threshold_pct=row["threshold_pct"],
            current_pct=row["current_pct"],
            triggered_at=row["triggered_at"],
            is_read=bool(row["is_read"]),
            metadata=json.loads(row["metadata"] or "{}"),
        )

    def get_summary(self, workspace_id: str) -> dict:
        """
        Get alert summary for dashboard.

        Returns:
            Dictionary with unread count and latest alert info
        """
        try:
            with self._connect() as conn:
                # Unread count
                row = conn.execute(
                    "SELECT COUNT(*) as count FROM billing_alerts WHERE workspace_id = ? AND is_read = 0",
                    (workspace_id,),
                ).fetchone()
                unread_count = row["count"] if row else 0

                # Latest alert
                latest = conn.execute(
                    """
                    SELECT alert_type, triggered_at FROM billing_alerts
                    WHERE workspace_id = ?
                    ORDER BY triggered_at DESC LIMIT 1
                    """,
                    (workspace_id,),
                ).fetchone()

                return {
                    "workspace_id": workspace_id,
                    "unread_count": unread_count,
                    "latest_alert_type": latest["alert_type"] if latest else None,
                    "latest_alert_at": latest["triggered_at"] if latest else None,
                }
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get alert summary: {exc}") from exc
