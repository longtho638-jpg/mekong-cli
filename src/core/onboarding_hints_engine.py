"""Personalized onboarding hints engine for RaaS.

Provides rule-based hint generation based on user's current onboarding step.
Stores dismissed hints in SQLite to avoid showing them again.

Usage:
    engine = OnboardingHintsEngine()
    hints = engine.get_personalized_hints(user_id="u123")
    engine.dismiss_hint(user_id="u123", hint_id="workspace_naming_tip")
"""
from __future__ import annotations

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
-- Hint dismissals table
CREATE TABLE IF NOT EXISTS onboarding_hint_dismissals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    hint_id         TEXT NOT NULL,
    dismissed_at    TEXT NOT NULL,
    reason          TEXT DEFAULT 'manual'
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_hint_dismissals_user ON onboarding_hint_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_hint_dismissals_hint ON onboarding_hint_dismissals(hint_id);
"""


@dataclass
class Hint:
    """A personalized onboarding hint."""

    hint_id: str
    category: str
    title: str
    message: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    priority: int = 1  # 1=high, 2=medium, 3=low
    metadata: Dict[str, Any] = field(default_factory=dict)


class OnboardingHintsEngine:
    """
    Rule-based hints engine for onboarding optimization.

    Provides personalized hints based on user's current onboarding step.
    Tracks dismissed hints to avoid repetition.

    Hint Categories:
    - signup: Email verification, profile completion tips
    - workspace: Naming tips, tier selection, team invites
    - llm_config: Provider recommendations, API key setup
    - tutorial: Command hints, expected output, troubleshooting
    - next_steps: Advanced features, upgrade suggestions

    Usage:
        engine = OnboardingHintsEngine()
        hints = engine.get_hints_for_step("workspace_created")
    """

    # Standard onboarding steps
    STEPS = [
        "signup_started",
        "workspace_created",
        "llm_configured",
        "tutorial_started",
        "tutorial_completed",
    ]

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        """
        Initialize hints engine.

        Args:
            db_path: Path to SQLite database file.
        """
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self._init_hints_catalog()

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
            raise RuntimeError(f"Failed to initialize hints DB: {exc}") from exc

    def _init_hints_catalog(self) -> None:
        """Initialize the catalog of rule-based hints."""
        # Hints organized by onboarding step
        self._hints_catalog: Dict[str, List[Hint]] = {
            "signup_started": [
                Hint(
                    hint_id="email_verification_tip",
                    category="signup",
                    title="Verify Your Email",
                    message="Check your inbox and click the verification link to unlock all features.",
                    priority=1,
                ),
                Hint(
                    hint_id="profile_completion_tip",
                    category="signup",
                    title="Complete Your Profile",
                    message="Add your company name and role to personalize your experience.",
                    priority=2,
                ),
            ],
            "workspace_created": [
                Hint(
                    hint_id="workspace_naming_tip",
                    category="workspace",
                    title="Choose a Descriptive Workspace Name",
                    message="Use a clear name like 'acme-marketing' or 'acme-dev' for easy identification.",
                    priority=2,
                ),
                Hint(
                    hint_id="tier_selection_tip",
                    category="workspace",
                    title="Select the Right Tier",
                    message="Start with Starter tier (200 MCU/month). Upgrade as you grow.",
                    action_url="/dashboard/billing",
                    action_label="View Plans",
                    priority=1,
                ),
                Hint(
                    hint_id="invite_team_tip",
                    category="workspace",
                    title="Invite Your Team",
                    message="Collaborate faster by inviting team members to your workspace.",
                    action_url="/dashboard/workspace/invite",
                    action_label="Invite Members",
                    priority=3,
                ),
            ],
            "llm_configured": [
                Hint(
                    hint_id="llm_provider_tip",
                    category="llm_config",
                    title="Test Your LLM Connection",
                    message="Run a test query to verify your LLM configuration is working.",
                    action_url="/dashboard/llm-config",
                    action_label="Test Connection",
                    priority=1,
                ),
                Hint(
                    hint_id="llm_fallback_tip",
                    category="llm_config",
                    title="Configure Fallback Providers",
                    message="Add backup LLM providers to ensure high availability.",
                    priority=2,
                ),
                Hint(
                    hint_id="api_key_security_tip",
                    category="llm_config",
                    title="Keep API Keys Secure",
                    message="Never commit API keys to version control. Use environment variables.",
                    priority=2,
                ),
            ],
            "tutorial_started": [
                Hint(
                    hint_id="tutorial_command_tip",
                    category="tutorial",
                    title="Use the CLI Command",
                    message="Run 'mekong onboarding start' to begin the interactive tutorial.",
                    priority=1,
                ),
                Hint(
                    hint_id="tutorial_expected_output",
                    category="tutorial",
                    title="What to Expect",
                    message="The tutorial creates a sample workspace and runs your first AI mission.",
                    priority=2,
                ),
                Hint(
                    hint_id="tutorial_troubleshooting",
                    category="tutorial",
                    title="Having Issues?",
                    message="Check logs with 'mekong logs --last 10m' for troubleshooting.",
                    priority=3,
                ),
            ],
            "tutorial_completed": [
                Hint(
                    hint_id="next_mission_tip",
                    category="next_steps",
                    title="Start Your First Mission",
                    message="Try creating a custom AI mission for your workflow.",
                    action_url="/dashboard/missions/new",
                    action_label="Create Mission",
                    priority=1,
                ),
                Hint(
                    hint_id="explore_features_tip",
                    category="next_steps",
                    title="Explore Advanced Features",
                    message="Discover A/B testing, analytics, and custom agents.",
                    action_url="/dashboard/features",
                    action_label="Explore",
                    priority=2,
                ),
                Hint(
                    hint_id="upgrade_tip",
                    category="next_steps",
                    title="Upgrade for More Power",
                    message="Unlock unlimited missions and premium features with Pro tier.",
                    action_url="/dashboard/billing",
                    action_label="Upgrade Now",
                    priority=2,
                ),
            ],
        }

    def get_hints_for_step(self, step_name: str) -> List[Hint]:
        """
        Get all hints for a specific onboarding step.

        Args:
            step_name: Name of the onboarding step.

        Returns:
            List of Hint objects for the step, sorted by priority.
        """
        hints = self._hints_catalog.get(step_name, [])
        # Sort by priority (1=high first)
        return sorted(hints, key=lambda h: h.priority)

    def get_personalized_hints(self, user_id: str) -> List[Hint]:
        """
        Get personalized hints for a user based on their current step.

        Determines user's current step from onboarding events,
        then returns relevant hints excluding dismissed ones.

        Args:
            user_id: User identifier.

        Returns:
            List of active (not dismissed) Hint objects.
        """
        from src.raas.onboarding_funnel_store import OnboardingFunnelStore

        try:
            store = OnboardingFunnelStore()
            events = store.get_user_funnel_progress(user_id=user_id)
        except (RuntimeError, ImportError):
            # If store not available or user has no events, return signup hints
            events = []

        # Determine current step
        current_step = self._determine_current_step(events)

        # Get hints for current step
        hints = self.get_hints_for_step(current_step)

        # Filter out dismissed hints
        dismissed = self._get_dismissed_hint_ids(user_id)
        active_hints = [h for h in hints if h.hint_id not in dismissed]

        logger.debug(
            f"Returning {len(active_hints)}/{len(hints)} hints for user {user_id} "
            f"(step={current_step}, dismissed={len(dismissed)})"
        )

        return active_hints

    def _determine_current_step(self, events: List[Dict[str, Any]]) -> str:
        """
        Determine user's current onboarding step from events.

        Args:
            events: List of onboarding events with event_type.

        Returns:
            Current step name, or "signup_started" if no events.
        """
        if not events:
            return "signup_started"

        # Find the furthest step completed
        completed_steps = {e.get("event_type") for e in events}

        # Return the last completed step
        for step in reversed(self.STEPS):
            if step in completed_steps:
                return step

        return "signup_started"

    def _get_dismissed_hint_ids(self, user_id: str) -> List[str]:
        """
        Get list of dismissed hint IDs for a user.

        Args:
            user_id: User identifier.

        Returns:
            List of dismissed hint IDs.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT hint_id FROM onboarding_hint_dismissals WHERE user_id = ?",
                    (user_id,),
                ).fetchall()
                return [row["hint_id"] for row in rows]
        except sqlite3.Error as exc:
            logger.error(f"Failed to get dismissed hints: {exc}")
            return []

    def dismiss_hint(self, user_id: str, hint_id: str, reason: str = "manual") -> bool:
        """
        Dismiss a hint for a user.

        Args:
            user_id: User identifier.
            hint_id: Hint identifier to dismiss.
            reason: Dismissal reason ("manual", "not_relevant", "already_done", etc.).

        Returns:
            True if successful, False if failed.
        """
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO onboarding_hint_dismissals
                    (user_id, hint_id, dismissed_at, reason)
                    VALUES (?, ?, ?, ?)
                    """,
                    (user_id, hint_id, now, reason),
                )
                conn.commit()
                logger.debug(f"Dismissed hint {hint_id} for user {user_id}")
                return True
        except sqlite3.Error as exc:
            logger.error(f"Failed to dismiss hint: {exc}")
            return False

    def get_active_hints(self, user_id: str) -> List[Hint]:
        """
        Get all active (not dismissed) hints for a user.

        Combines hints from all steps, filtered by dismissed status.
        Useful for showing a hints dashboard.

        Args:
            user_id: User identifier.

        Returns:
            List of all active Hint objects.
        """
        dismissed = self._get_dismissed_hint_ids(user_id)
        active_hints: List[Hint] = []

        for step_hints in self._hints_catalog.values():
            for hint in step_hints:
                if hint.hint_id not in dismissed:
                    active_hints.append(hint)

        # Sort by priority then category
        active_hints.sort(key=lambda h: (h.priority, h.category))

        return active_hints

    def get_hint_by_id(self, hint_id: str) -> Optional[Hint]:
        """
        Get a specific hint by its ID.

        Args:
            hint_id: Hint identifier.

        Returns:
            Hint object or None if not found.
        """
        for hints in self._hints_catalog.values():
            for hint in hints:
                if hint.hint_id == hint_id:
                    return hint
        return None

    def get_all_hints(self) -> List[Hint]:
        """
        Get all hints from the catalog.

        Returns:
            List of all Hint objects.
        """
        all_hints: List[Hint] = []
        for hints in self._hints_catalog.values():
            all_hints.extend(hints)
        return sorted(all_hints, key=lambda h: (h.category, h.priority))

    def get_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get hint statistics for a user.

        Args:
            user_id: User identifier.

        Returns:
            Dictionary with hint stats.
        """
        all_hints = self.get_all_hints()
        dismissed = self._get_dismissed_hint_ids(user_id)
        active = self.get_active_hints(user_id)

        return {
            "total_hints": len(all_hints),
            "dismissed_count": len(dismissed),
            "active_count": len(active),
            "dismissal_rate": round(
                (len(dismissed) / len(all_hints) * 100) if all_hints else 0, 2
            ),
        }
