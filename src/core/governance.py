"""Mekong CLI - Governance Layer.

Safety governance for autonomous operations.
Classifies actions as safe/review_required/forbidden.
Maintains audit trail in .mekong/audit.yaml.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

import yaml  # type: ignore[import-untyped]

from .event_bus import EventType, get_event_bus


class ActionClass(str, Enum):
    """Classification of an action's safety level."""

    SAFE = "safe"
    REVIEW_REQUIRED = "review_required"
    FORBIDDEN = "forbidden"


@dataclass
class GovernanceDecision:
    """Result of governance classification."""

    action_class: ActionClass
    reason: str
    requires_approval: bool = False
    approved: bool = False
    timestamp: float = field(default_factory=time.time)


@dataclass
class AuditEntry:
    """Single audit trail entry."""

    timestamp: float = field(default_factory=time.time)
    goal: str = ""
    action_class: str = ""
    approved: bool = False
    result: str = ""  # "executed" | "blocked" | "rejected"


class Governance:
    """Safety governance layer for autonomous operations."""

    FORBIDDEN_PATTERNS: list[str] = [
        r"\brm\s+-rf\b", r"\bdrop\s+(database|table)\b",
        r"\bdelete\s+all\b", r"\bdestroy\b", r"\bformat\b",
        r"\btruncate\b",
    ]

    REVIEW_PATTERNS: list[str] = [
        r"\bdeploy\b.*\bprod", r"\bpush\b.*\bmain\b",
        r"\bmodify\b.*\bconfig\b", r"\bupdate\b.*\bdns\b",
        r"\bmigrate\b",
    ]

    MAX_AUDIT: int = 1000

    def __init__(self, audit_path: str | None = None) -> None:
        """Initialize governance layer."""
        self.audit_path = audit_path or ".mekong/audit.yaml"
        self._halted = False
        self._audit: list[AuditEntry] = []
        self._load_audit()

    def classify(self, goal: str) -> GovernanceDecision:
        """Classify a goal as safe, review_required, or forbidden."""
        goal_lower = goal.lower()

        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, goal_lower):
                return GovernanceDecision(
                    action_class=ActionClass.FORBIDDEN,
                    reason=f"Matched forbidden pattern: {pattern}",
                )

        for pattern in self.REVIEW_PATTERNS:
            if re.search(pattern, goal_lower):
                return GovernanceDecision(
                    action_class=ActionClass.REVIEW_REQUIRED,
                    reason=f"Matched review pattern: {pattern}",
                    requires_approval=True,
                )

        return GovernanceDecision(
            action_class=ActionClass.SAFE,
            reason="No dangerous patterns detected",
        )

    def request_approval(self, goal: str, decision: GovernanceDecision) -> bool:
        """Request human approval. Placeholder — returns True."""
        decision.approved = True
        return True

    def record_audit(self, entry: AuditEntry) -> None:
        """Record an audit entry with FIFO eviction."""
        self._audit.append(entry)
        if len(self._audit) > self.MAX_AUDIT:
            self._audit = self._audit[-self.MAX_AUDIT:]
        self._save_audit()

    def get_audit_trail(self, limit: int = 50) -> list[AuditEntry]:
        """Get recent audit entries."""
        return self._audit[-limit:]

    def is_halted(self) -> bool:
        """Check if system is halted."""
        return self._halted

    def halt(self) -> None:
        """Halt all autonomous operations."""
        self._halted = True
        bus = get_event_bus()
        bus.emit(EventType.HALT_TRIGGERED, {"timestamp": time.time()})

    def resume(self) -> None:
        """Resume autonomous operations."""
        self._halted = False

    def _load_audit(self) -> None:
        """Load audit trail from YAML."""
        path = Path(self.audit_path)
        if not path.exists():
            self._audit = []
            return
        try:
            data = yaml.safe_load(path.read_text()) or []
            self._audit = [
                AuditEntry(
                    timestamp=d.get("timestamp", 0),
                    goal=d.get("goal", ""),
                    action_class=d.get("action_class", ""),
                    approved=d.get("approved", False),
                    result=d.get("result", ""),
                )
                for d in data
            ]
        except Exception:
            self._audit = []

    def _save_audit(self) -> None:
        """Save audit trail to YAML."""
        path = Path(self.audit_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        data = [
            {
                "timestamp": e.timestamp,
                "goal": e.goal,
                "action_class": e.action_class,
                "approved": e.approved,
                "result": e.result,
            }
            for e in self._audit
        ]
        path.write_text(yaml.dump(data, default_flow_style=False))


__all__ = [
    "ActionClass",
    "AuditEntry",
    "Governance",
    "GovernanceDecision",
]
