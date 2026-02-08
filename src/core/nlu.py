"""
Mekong CLI - Natural Language Understanding

Keyword + regex intent classifier with Vietnamese support.
Classifies goals into intents and extracts entities.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class Intent(str, Enum):
    """Recognized goal intents."""

    DEPLOY = "deploy"
    AUDIT = "audit"
    CREATE = "create"
    FIX = "fix"
    STATUS = "status"
    SCHEDULE = "schedule"
    UNKNOWN = "unknown"


@dataclass
class IntentResult:
    """Result of NLU classification."""

    intent: Intent
    confidence: float  # 0.0-1.0
    entities: Dict[str, str] = field(default_factory=dict)
    suggested_recipe: str = ""
    raw_goal: str = ""


# Keyword mapping: intent -> list of trigger words (EN + VN)
KEYWORD_MAP: Dict[Intent, List[str]] = {
    Intent.DEPLOY: ["deploy", "ship", "push", "publish", "trien khai", "triển khai"],
    Intent.AUDIT: ["audit", "check", "scan", "inspect", "kiem tra", "kiểm tra"],
    Intent.CREATE: ["create", "new", "init", "generate", "tao", "tạo"],
    Intent.FIX: ["fix", "repair", "debug", "patch", "sua", "sửa"],
    Intent.STATUS: ["status", "health", "info", "trang thai", "trạng thái"],
    Intent.SCHEDULE: ["schedule", "every", "daily", "cron", "len lich", "lên lịch"],
}

# Entity extraction patterns
_PROJECT_RE = re.compile(
    r"(?:deploy|ship|audit|check|create|fix|trien khai|triển khai)\s+(\w[\w-]*)",
    re.IGNORECASE,
)
_INTERVAL_RE = re.compile(
    r"every\s+(\d+)\s*(min|mins|minutes|hour|hours|s|sec|seconds)",
    re.IGNORECASE,
)
_TARGET_RE = re.compile(
    r"(?:of|on|for)\s+([\w.-]+)",
    re.IGNORECASE,
)

# Interval normalization multipliers
_INTERVAL_MULTIPLIERS = {
    "s": 1, "sec": 1, "seconds": 1,
    "min": 60, "mins": 60, "minutes": 60,
    "hour": 3600, "hours": 3600,
}


class IntentClassifier:
    """Keyword + regex intent classifier with optional LLM fallback."""

    def __init__(self, llm_client: Optional[Any] = None) -> None:
        """
        Initialize classifier.

        Args:
            llm_client: Optional LLM client for fallback classification
        """
        self.llm_client = llm_client

    def classify(self, goal: str) -> IntentResult:
        """
        Classify a goal string into an intent with entities.

        Args:
            goal: User's goal string

        Returns:
            IntentResult with intent, confidence, and extracted entities
        """
        intent, confidence = self._keyword_match(goal)
        entities = self._extract_entities(goal, intent)

        result = IntentResult(
            intent=intent,
            confidence=confidence,
            entities=entities,
            raw_goal=goal,
        )

        # LLM fallback for low confidence
        if confidence < 0.5 and self.llm_client and hasattr(self.llm_client, "generate"):
            try:
                result = self._llm_fallback(goal)
            except Exception:
                pass  # Stick with keyword result

        return result

    def _keyword_match(self, goal: str) -> Tuple[Intent, float]:
        """Match goal against keyword map."""
        goal_lower = goal.lower()

        for intent, keywords in KEYWORD_MAP.items():
            for keyword in keywords:
                if keyword in goal_lower:
                    # Exact word match = higher confidence
                    words = goal_lower.split()
                    if keyword in words or " " in keyword:
                        return intent, 0.9
                    return intent, 0.7

        return Intent.UNKNOWN, 0.1

    def _extract_entities(self, goal: str, intent: Intent) -> Dict[str, str]:
        """Extract entities from goal string."""
        entities: Dict[str, str] = {}

        # Project name
        match = _PROJECT_RE.search(goal)
        if match:
            candidate = match.group(1).lower()
            # Skip if candidate is a keyword itself
            all_keywords = [kw for kws in KEYWORD_MAP.values() for kw in kws]
            if candidate not in all_keywords:
                entities["project"] = candidate

        # Time interval
        match = _INTERVAL_RE.search(goal)
        if match:
            value = int(match.group(1))
            unit = match.group(2).lower()
            multiplier = _INTERVAL_MULTIPLIERS.get(unit, 1)
            entities["interval"] = str(value * multiplier)

        # Target
        match = _TARGET_RE.search(goal)
        if match:
            entities["target"] = match.group(1)

        return entities

    def _llm_fallback(self, goal: str) -> IntentResult:
        """Use LLM to classify ambiguous goals."""
        prompt = (
            f"Classify this goal into one intent: DEPLOY, AUDIT, CREATE, FIX, STATUS, SCHEDULE, or UNKNOWN.\n"
            f"Goal: \"{goal}\"\n"
            f"Reply with ONLY the intent name."
        )
        response = self.llm_client.generate(prompt).strip().upper()

        try:
            intent = Intent(response.lower())
        except ValueError:
            intent = Intent.UNKNOWN

        return IntentResult(
            intent=intent,
            confidence=0.6,
            entities=self._extract_entities(goal, intent),
            raw_goal=goal,
        )


__all__ = [
    "Intent",
    "IntentResult",
    "IntentClassifier",
    "KEYWORD_MAP",
]
