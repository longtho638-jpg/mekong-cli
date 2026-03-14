"""A/B test framework for onboarding optimization.

Provides experiment management, deterministic user assignment,
and conversion tracking for A/B testing onboarding flows.

Usage:
    service = ABTestService()
    service.create_experiment("welcome_email", "Test welcome email", "none", "email", 50)
    variant = service.get_assignment("user_123", "welcome_email")
    service.record_exposure("user_123", "welcome_email", variant)
    service.record_conversion("user_123", "welcome_email")
"""
from __future__ import annotations

import hashlib
import json
import logging
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_DDL = """
-- A/B test experiments table
CREATE TABLE IF NOT EXISTS ab_experiments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT UNIQUE NOT NULL,
    description     TEXT,
    variant_a       TEXT DEFAULT 'control',
    variant_b       TEXT DEFAULT 'treatment',
    allocation      INTEGER DEFAULT 50,
    status          TEXT DEFAULT 'draft',
    created_at      TEXT NOT NULL,
    started_at      TEXT,
    ended_at        TEXT
);

-- User experiment assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    experiment_name TEXT NOT NULL,
    variant         TEXT NOT NULL,
    exposed         INTEGER DEFAULT 0,
    converted       INTEGER DEFAULT 0,
    assigned_at     TEXT NOT NULL,
    exposed_at      TEXT,
    converted_at    TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);
"""


@dataclass
class Experiment:
    """An A/B test experiment."""

    name: str
    description: str
    variant_a: str
    variant_b: str
    allocation: int
    status: str
    created_at: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    id: Optional[int] = None


@dataclass
class Assignment:
    """A user's assignment to an experiment variant."""

    user_id: str
    experiment_name: str
    variant: str
    exposed: bool
    converted: bool
    assigned_at: str
    exposed_at: Optional[str] = None
    converted_at: Optional[str] = None
    id: Optional[int] = None


@dataclass
class ExperimentResults:
    """Results from an A/B test experiment."""

    experiment_name: str
    total_users: int
    variant_a_users: int
    variant_b_users: int
    variant_a_conversions: int
    variant_b_conversions: int
    variant_a_rate: float
    variant_b_rate: float
    relative_improvement: float


class ABTestService:
    """
    A/B test service for onboarding optimization.

    Features:
    - Create/manage experiments
    - Deterministic variant assignment using hash(user_id + experiment_name)
    - Track exposure and conversion events
    - Calculate experiment results

    Usage:
        service = ABTestService()
        service.create_experiment("welcome_email", "Test welcome email", "none", "email", 50)
        variant = service.get_assignment("user_123", "welcome_email")
    """

    # Experiment status values
    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_PAUSED = "paused"
    STATUS_COMPLETED = "completed"

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        """
        Initialize A/B test service.

        Args:
            db_path: Path to SQLite database file.
        """
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Open WAL-mode connection."""
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self) -> None:
        """Create tables and indexes if they don't exist."""
        try:
            with self._connect() as conn:
                conn.executescript(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize A/B test DB: {exc}") from exc

    def _hash_assignment(self, user_id: str, experiment_name: str) -> int:
        """
        Generate deterministic hash for user assignment.

        Uses MD5 hash of (user_id + experiment_name) to ensure
        consistent assignment across requests.

        Args:
            user_id: User identifier.
            experiment_name: Experiment name.

        Returns:
            Integer hash value (0-99).
        """
        key = f"{user_id}:{experiment_name}"
        hash_bytes = hashlib.md5(key.encode()).hexdigest()
        return int(hash_bytes[:8], 16) % 100

    def create_experiment(
        self,
        name: str,
        description: str,
        variant_a: str = "control",
        variant_b: str = "treatment",
        allocation: int = 50,
    ) -> Experiment:
        """
        Create a new A/B test experiment.

        Args:
            name: Unique experiment identifier.
            description: Human-readable description.
            variant_a: Control variant name (default "control").
            variant_b: Treatment variant name (default "treatment").
            allocation: Percentage of users in variant B (0-100, default 50).

        Returns:
            Created Experiment object.

        Raises:
            RuntimeError: If database write fails.
            ValueError: If experiment name already exists.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO ab_experiments (name, description, variant_a, variant_b, allocation, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (name, description, variant_a, variant_b, allocation, self.STATUS_DRAFT, now),
                )
                conn.commit()
        except sqlite3.IntegrityError as exc:
            raise ValueError(f"Experiment '{name}' already exists") from exc
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create experiment: {exc}") from exc

        logger.info(f"Created A/B test experiment: {name}")

        return Experiment(
            id=None,
            name=name,
            description=description,
            variant_a=variant_a,
            variant_b=variant_b,
            allocation=allocation,
            status=self.STATUS_DRAFT,
            created_at=now,
        )

    def get_experiment(self, experiment_name: str) -> Optional[Experiment]:
        """
        Get experiment by name.

        Args:
            experiment_name: Experiment name to retrieve.

        Returns:
            Experiment object or None if not found.
        """
        try:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    SELECT id, name, description, variant_a, variant_b, allocation,
                           status, created_at, started_at, ended_at
                    FROM ab_experiments
                    WHERE name = ?
                    """,
                    (experiment_name,),
                ).fetchone()

                if row:
                    return Experiment(
                        id=row["id"],
                        name=row["name"],
                        description=row["description"],
                        variant_a=row["variant_a"],
                        variant_b=row["variant_b"],
                        allocation=row["allocation"],
                        status=row["status"],
                        created_at=row["created_at"],
                        started_at=row["started_at"],
                        ended_at=row["ended_at"],
                    )
                return None
        except sqlite3.Error as exc:
            logger.error(f"Failed to get experiment: {exc}")
            return None

    def start_experiment(self, experiment_name: str) -> bool:
        """
        Start an experiment (set status to active).

        Args:
            experiment_name: Experiment to start.

        Returns:
            True if successful, False if experiment not found.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    """
                    UPDATE ab_experiments
                    SET status = ?, started_at = ?
                    WHERE name = ? AND status = ?
                    """,
                    (self.STATUS_ACTIVE, now, experiment_name, self.STATUS_DRAFT),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            logger.error(f"Failed to start experiment: {exc}")
            return False

    def pause_experiment(self, experiment_name: str) -> bool:
        """
        Pause an active experiment.

        Args:
            experiment_name: Experiment to pause.

        Returns:
            True if successful, False if experiment not active.
        """
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    """
                    UPDATE ab_experiments
                    SET status = ?
                    WHERE name = ? AND status = ?
                    """,
                    (self.STATUS_PAUSED, experiment_name, self.STATUS_ACTIVE),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            logger.error(f"Failed to pause experiment: {exc}")
            return False

    def complete_experiment(self, experiment_name: str) -> bool:
        """
        Mark experiment as completed.

        Args:
            experiment_name: Experiment to complete.

        Returns:
            True if successful, False if experiment not found.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    """
                    UPDATE ab_experiments
                    SET status = ?, ended_at = ?
                    WHERE name = ?
                    """,
                    (self.STATUS_COMPLETED, now, experiment_name),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            logger.error(f"Failed to complete experiment: {exc}")
            return False

    def get_assignment(self, user_id: str, experiment_name: str) -> Optional[str]:
        """
        Get deterministic variant assignment for a user.

        Uses hash(user_id + experiment_name) to ensure consistent assignment.
        Respects experiment allocation percentage.

        Args:
            user_id: User identifier.
            experiment_name: Experiment name.

        Returns:
            Variant name (variant_a or variant_b), or None if experiment not found/active.
        """
        experiment = self.get_experiment(experiment_name)
        if not experiment or experiment.status != self.STATUS_ACTIVE:
            return None

        # Check if user already assigned
        try:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    SELECT variant FROM ab_assignments
                    WHERE user_id = ? AND experiment_name = ?
                    """,
                    (user_id, experiment_name),
                ).fetchone()

                if row:
                    return row["variant"]
        except sqlite3.Error as exc:
            logger.error(f"Failed to check existing assignment: {exc}")

        # Generate deterministic assignment
        hash_value = self._hash_assignment(user_id, experiment_name)

        # Allocation determines threshold for variant B
        # If allocation=50, hash 0-49 -> variant_a, 50-99 -> variant_b
        if hash_value < experiment.allocation:
            variant = experiment.variant_b
        else:
            variant = experiment.variant_a

        # Store assignment
        self._store_assignment(user_id, experiment_name, variant)

        logger.debug(f"Assigned user {user_id} to variant '{variant}' for {experiment_name}")
        return variant

    def _store_assignment(
        self,
        user_id: str,
        experiment_name: str,
        variant: str,
    ) -> None:
        """Store user assignment to database."""
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO ab_assignments (user_id, experiment_name, variant, assigned_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (user_id, experiment_name, variant, now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            logger.error(f"Failed to store assignment: {exc}")

    def record_exposure(
        self,
        user_id: str,
        experiment_name: str,
        variant: str,
    ) -> bool:
        """
        Record that a user was exposed to an experiment variant.

        Args:
            user_id: User identifier.
            experiment_name: Experiment name.
            variant: Variant user was exposed to.

        Returns:
            True if successful, False if failed.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE ab_assignments
                    SET exposed = 1, exposed_at = ?
                    WHERE user_id = ? AND experiment_name = ? AND variant = ?
                    """,
                    (now, user_id, experiment_name, variant),
                )
                conn.commit()
                return True
        except sqlite3.Error as exc:
            logger.error(f"Failed to record exposure: {exc}")
            return False

    def record_conversion(
        self,
        user_id: str,
        experiment_name: str,
    ) -> bool:
        """
        Record that a user converted in an experiment.

        Args:
            user_id: User identifier.
            experiment_name: Experiment name.

        Returns:
            True if successful, False if user not assigned.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    """
                    UPDATE ab_assignments
                    SET converted = 1, converted_at = ?
                    WHERE user_id = ? AND experiment_name = ?
                    """,
                    (now, user_id, experiment_name),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            logger.error(f"Failed to record conversion: {exc}")
            return False

    def get_experiment_results(self, experiment_name: str) -> Optional[ExperimentResults]:
        """
        Get experiment results with conversion statistics.

        Args:
            experiment_name: Experiment name.

        Returns:
            ExperimentResults object, or None if experiment not found.
        """
        try:
            with self._connect() as conn:
                # Get experiment details
                exp_row = conn.execute(
                    """
                    SELECT variant_a, variant_b FROM ab_experiments
                    WHERE name = ?
                    """,
                    (experiment_name,),
                ).fetchone()

                if not exp_row:
                    return None

                # Get variant A stats
                a_row = conn.execute(
                    """
                    SELECT
                        COUNT(*) as total,
                        SUM(converted) as conversions
                    FROM ab_assignments
                    WHERE experiment_name = ? AND variant = ?
                    """,
                    (experiment_name, exp_row["variant_a"]),
                ).fetchone()

                # Get variant B stats
                b_row = conn.execute(
                    """
                    SELECT
                        COUNT(*) as total,
                        SUM(converted) as conversions
                    FROM ab_assignments
                    WHERE experiment_name = ? AND variant = ?
                    """,
                    (experiment_name, exp_row["variant_b"]),
                ).fetchone()

                variant_a_users = a_row["total"] or 0
                variant_b_users = b_row["total"] or 0
                variant_a_conversions = a_row["conversions"] or 0
                variant_b_conversions = b_row["conversions"] or 0

                # Calculate conversion rates
                variant_a_rate = (
                    (variant_a_conversions / variant_a_users * 100) if variant_a_users > 0 else 0.0
                )
                variant_b_rate = (
                    (variant_b_conversions / variant_b_users * 100) if variant_b_users > 0 else 0.0
                )

                # Calculate relative improvement
                relative_improvement = 0.0
                if variant_a_rate > 0:
                    relative_improvement = (
                        (variant_b_rate - variant_a_rate) / variant_a_rate * 100
                    )

                return ExperimentResults(
                    experiment_name=experiment_name,
                    total_users=variant_a_users + variant_b_users,
                    variant_a_users=variant_a_users,
                    variant_b_users=variant_b_users,
                    variant_a_conversions=variant_a_conversions,
                    variant_b_conversions=variant_b_conversions,
                    variant_a_rate=round(variant_a_rate, 2),
                    variant_b_rate=round(variant_b_rate, 2),
                    relative_improvement=round(relative_improvement, 2),
                )

        except sqlite3.Error as exc:
            logger.error(f"Failed to get experiment results: {exc}")
            return None

    def list_experiments(self, status: Optional[str] = None) -> List[Experiment]:
        """
        List all experiments, optionally filtered by status.

        Args:
            status: Optional status filter (draft, active, paused, completed).

        Returns:
            List of Experiment objects.
        """
        try:
            with self._connect() as conn:
                if status:
                    rows = conn.execute(
                        """
                        SELECT id, name, description, variant_a, variant_b, allocation,
                               status, created_at, started_at, ended_at
                        FROM ab_experiments
                        WHERE status = ?
                        ORDER BY created_at DESC
                        """,
                        (status,),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT id, name, description, variant_a, variant_b, allocation,
                               status, created_at, started_at, ended_at
                        FROM ab_experiments
                        ORDER BY created_at DESC
                        """,
                    ).fetchall()

                return [
                    Experiment(
                        id=row["id"],
                        name=row["name"],
                        description=row["description"],
                        variant_a=row["variant_a"],
                        variant_b=row["variant_b"],
                        allocation=row["allocation"],
                        status=row["status"],
                        created_at=row["created_at"],
                        started_at=row["started_at"],
                        ended_at=row["ended_at"],
                    )
                    for row in rows
                ]

        except sqlite3.Error as exc:
            logger.error(f"Failed to list experiments: {exc}")
            return []

    def get_user_assignments(self, user_id: str) -> List[Assignment]:
        """
        Get all experiment assignments for a user.

        Args:
            user_id: User identifier.

        Returns:
            List of Assignment objects.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT id, user_id, experiment_name, variant, exposed, converted,
                           assigned_at, exposed_at, converted_at
                    FROM ab_assignments
                    WHERE user_id = ?
                    ORDER BY assigned_at DESC
                    """,
                    (user_id,),
                ).fetchall()

                return [
                    Assignment(
                        id=row["id"],
                        user_id=row["user_id"],
                        experiment_name=row["experiment_name"],
                        variant=row["variant"],
                        exposed=bool(row["exposed"]),
                        converted=bool(row["converted"]),
                        assigned_at=row["assigned_at"],
                        exposed_at=row["exposed_at"],
                        converted_at=row["converted_at"],
                    )
                    for row in rows
                ]

        except sqlite3.Error as exc:
            logger.error(f"Failed to get user assignments: {exc}")
            return []
