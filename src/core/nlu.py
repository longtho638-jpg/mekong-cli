"""
Mekong CLI - Natural Language Understanding (AGI v2)

Hybrid intent classifier: keyword fast-path + LLM chain-of-thought fallback.
Supports multi-intent, Vietnamese, conversation context, and structured JSON output.
"""

import json
import re
import time
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
    REFACTOR = "refactor"
    OPTIMIZE = "optimize"
    MIGRATE = "migrate"
    REPORT = "report"
    UNKNOWN = "unknown"


@dataclass
class IntentResult:
    """Result of NLU classification."""

    intent: Intent
    confidence: float  # 0.0-1.0
    entities: Dict[str, str] = field(default_factory=dict)
    suggested_recipe: str = ""
    raw_goal: str = ""
    reasoning: str = ""  # LLM chain-of-thought explanation
    secondary_intents: List[Intent] = field(default_factory=list)


@dataclass
class ConversationTurn:
    """Single turn in conversation history."""

    role: str  # "user" | "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)


class ConversationContext:
    """Maintains multi-turn conversation memory for context-aware NLU."""

    MAX_TURNS: int = 10

    def __init__(self) -> None:
        self._turns: List[ConversationTurn] = []

    def add_turn(self, role: str, content: str) -> None:
        """Record a conversation turn."""
        self._turns.append(ConversationTurn(role=role, content=content))
        if len(self._turns) > self.MAX_TURNS:
            self._turns = self._turns[-self.MAX_TURNS:]

    def get_context_summary(self) -> str:
        """Format recent turns for LLM context injection."""
        if not self._turns:
            return "No previous conversation."
        lines = []
        for turn in self._turns[-5:]:
            prefix = "User" if turn.role == "user" else "Assistant"
            lines.append(f"{prefix}: {turn.content}")
        return "\n".join(lines)

    def get_last_goal(self) -> Optional[str]:
        """Return the most recent user goal."""
        for turn in reversed(self._turns):
            if turn.role == "user":
                return turn.content
        return None

    @property
    def turns(self) -> List[ConversationTurn]:
        return list(self._turns)

    def clear(self) -> None:
        self._turns.clear()


# Keyword mapping: intent -> list of trigger words (EN + VN)
KEYWORD_MAP: Dict[Intent, List[str]] = {
    Intent.DEPLOY: [
        "deploy", "ship", "push", "publish",
        "trien khai", "triển khai", "đẩy lên",
    ],
    Intent.AUDIT: [
        "audit", "check", "scan", "inspect", "review",
        "kiem tra", "kiểm tra", "rà soát",
    ],
    Intent.CREATE: [
        "create", "new", "init", "generate", "build", "make",
        "tao", "tạo", "xây", "khởi tạo",
    ],
    Intent.FIX: [
        "fix", "repair", "debug", "patch", "resolve", "hotfix",
        "sua", "sửa", "vá", "khắc phục",
    ],
    Intent.STATUS: [
        "status", "health", "info", "monitor",
        "trang thai", "trạng thái", "tình trạng",
    ],
    Intent.SCHEDULE: [
        "schedule", "every", "daily", "cron", "periodic",
        "len lich", "lên lịch", "định kỳ",
    ],
    Intent.REFACTOR: [
        "refactor", "restructure", "clean up", "reorganize",
        "tái cấu trúc", "dọn dẹp", "cải tổ",
    ],
    Intent.OPTIMIZE: [
        "optimize", "speed up", "performance", "faster", "cache",
        "tối ưu", "tăng tốc", "nhanh hơn",
    ],
    Intent.MIGRATE: [
        "migrate", "upgrade", "move", "transfer", "port",
        "di chuyển", "nâng cấp", "chuyển đổi",
    ],
    Intent.REPORT: [
        "report", "summary", "analyze", "analytics", "dashboard",
        "báo cáo", "tổng hợp", "phân tích", "thống kê",
    ],
}

# Entity extraction patterns
_PROJECT_RE = re.compile(
    r"(?:deploy|ship|audit|check|create|fix|refactor|optimize|migrate|"
    r"trien khai|triển khai|tạo|sửa|tối ưu)\s+(\w[\w-]*)",
    re.IGNORECASE,
)
_INTERVAL_RE = re.compile(
    r"every\s+(\d+)\s*(min|mins|minutes|hour|hours|s|sec|seconds)",
    re.IGNORECASE,
)
_TARGET_RE = re.compile(
    r"(?:of|on|for|cho|của|trên)\s+([\w.-]+)",
    re.IGNORECASE,
)
_FILE_RE = re.compile(
    r"([\w/.-]+\.(?:py|js|ts|jsx|tsx|css|html|json|yaml|yml|md|sh))",
    re.IGNORECASE,
)

# Interval normalization multipliers
_INTERVAL_MULTIPLIERS = {
    "s": 1, "sec": 1, "seconds": 1,
    "min": 60, "mins": 60, "minutes": 60,
    "hour": 3600, "hours": 3600,
}

# LLM classification prompt template
_LLM_CLASSIFY_PROMPT = """You are the NLU brain of Mekong CLI, an AGI agent framework.
Classify the user's goal into intent(s) and extract entities.

## Available Intents
- DEPLOY: Ship/publish/deploy code or services
- AUDIT: Check/scan/inspect/review code or systems
- CREATE: Create/generate/build new things
- FIX: Fix/repair/debug/patch issues
- STATUS: Check health/status/info
- SCHEDULE: Set up periodic/cron tasks
- REFACTOR: Restructure/clean up code
- OPTIMIZE: Improve performance/speed
- MIGRATE: Move/upgrade/transfer systems
- REPORT: Generate reports/analytics/summaries
- UNKNOWN: Cannot classify

## Conversation Context
{context}

## User Goal
"{goal}"

## Instructions
Think step by step:
1. What is the user trying to accomplish?
2. Which intent best matches? Are there secondary intents?
3. What entities can you extract (project name, file, target, etc.)?

Return ONLY valid JSON:
{{
  "intent": "DEPLOY",
  "confidence": 0.95,
  "secondary_intents": ["AUDIT"],
  "entities": {{"project": "my-app", "target": "production"}},
  "reasoning": "User wants to deploy their app to production"
}}"""


class IntentClassifier:
    """Hybrid keyword + LLM intent classifier with conversation context."""

    def __init__(
        self,
        llm_client: Optional[Any] = None,
        conversation: Optional[ConversationContext] = None,
    ) -> None:
        """
        Initialize classifier.

        Args:
            llm_client: Optional LLM client for chain-of-thought classification
            conversation: Optional conversation context for multi-turn support
        """
        self.llm_client = llm_client
        self.conversation = conversation or ConversationContext()

    def classify(self, goal: str) -> IntentResult:
        """
        Classify a goal string into an intent with entities.

        Uses keyword matching first (fast path, high confidence).
        Falls back to LLM chain-of-thought for ambiguous goals.

        Args:
            goal: User's goal string

        Returns:
            IntentResult with intent, confidence, entities, and reasoning
        """
        # Record this goal in conversation context
        self.conversation.add_turn("user", goal)

        # Fast path: keyword matching
        intent, confidence = self._keyword_match(goal)
        entities = self._extract_entities(goal, intent)

        result = IntentResult(
            intent=intent,
            confidence=confidence,
            entities=entities,
            raw_goal=goal,
        )

        # LLM upgrade for low confidence or UNKNOWN intent
        if (confidence < 0.5 or intent == Intent.UNKNOWN) and self._has_llm():
            try:
                llm_result = self._llm_classify(goal)
                if llm_result.confidence > result.confidence:
                    result = llm_result
            except Exception:
                pass  # Stick with keyword result

        return result

    def classify_batch(self, goals: List[str]) -> List[IntentResult]:
        """Classify multiple goals."""
        return [self.classify(goal) for goal in goals]

    def _has_llm(self) -> bool:
        """Check if LLM client is available and functional."""
        return (
            self.llm_client is not None
            and hasattr(self.llm_client, "generate")
        )

    def _keyword_match(self, goal: str) -> Tuple[Intent, float]:
        """Match goal against keyword map. Returns (intent, confidence)."""
        goal_lower = goal.lower()
        matches: List[Tuple[Intent, float]] = []

        for intent, keywords in KEYWORD_MAP.items():
            for keyword in keywords:
                if keyword in goal_lower:
                    words = goal_lower.split()
                    if keyword in words or " " in keyword:
                        matches.append((intent, 0.9))
                    else:
                        matches.append((intent, 0.7))

        if not matches:
            return Intent.UNKNOWN, 0.1

        # Return highest confidence match
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[0]

    def _extract_entities(self, goal: str, intent: Intent) -> Dict[str, str]:
        """Extract entities from goal string using regex patterns."""
        entities: Dict[str, str] = {}

        # Project name
        match = _PROJECT_RE.search(goal)
        if match:
            candidate = match.group(1).lower()
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

        # File paths
        match = _FILE_RE.search(goal)
        if match:
            entities["file"] = match.group(1)

        return entities

    def _llm_classify(self, goal: str) -> IntentResult:
        """
        Use LLM with chain-of-thought to classify ambiguous goals.

        Returns structured IntentResult with reasoning trace.
        """
        context = self.conversation.get_context_summary()
        prompt = _LLM_CLASSIFY_PROMPT.format(context=context, goal=goal)

        if self.llm_client is None:
            return IntentResult(
                intent=Intent.UNKNOWN,
                confidence=0.1,
                raw_goal=goal,
            )

        # Try structured JSON generation first
        response_text = ""
        if hasattr(self.llm_client, "generate_json"):
            try:
                result = self.llm_client.generate_json(prompt)
                if isinstance(result, dict) and "intent" in result:
                    return self._parse_llm_response(result, goal)
            except Exception:
                pass

        # Fallback to raw text generation
        if hasattr(self.llm_client, "generate"):
            response_text = self.llm_client.generate(prompt).strip()
        else:
            return IntentResult(
                intent=Intent.UNKNOWN, confidence=0.1, raw_goal=goal,
            )

        # Parse JSON from response
        try:
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r"\{[^{}]*\}", response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return self._parse_llm_response(data, goal)
        except (json.JSONDecodeError, KeyError):
            pass

        # Last resort: check if response is just an intent name
        response_upper = response_text.strip().upper()
        try:
            intent = Intent(response_upper.lower())
            return IntentResult(
                intent=intent, confidence=0.6, raw_goal=goal,
                entities=self._extract_entities(goal, intent),
            )
        except ValueError:
            pass

        return IntentResult(
            intent=Intent.UNKNOWN, confidence=0.1, raw_goal=goal,
        )

    def _parse_llm_response(
        self, data: Dict[str, Any], goal: str,
    ) -> IntentResult:
        """Parse structured LLM response into IntentResult."""
        try:
            intent = Intent(data.get("intent", "unknown").lower())
        except ValueError:
            intent = Intent.UNKNOWN

        confidence = float(data.get("confidence", 0.6))
        confidence = max(0.0, min(1.0, confidence))

        entities = data.get("entities", {})
        if not isinstance(entities, dict):
            entities = {}
        # Ensure all entity values are strings
        entities = {k: str(v) for k, v in entities.items()}

        reasoning = data.get("reasoning", "")

        secondary = []
        for s in data.get("secondary_intents", []):
            try:
                secondary.append(Intent(s.lower()))
            except ValueError:
                pass

        return IntentResult(
            intent=intent,
            confidence=confidence,
            entities=entities,
            raw_goal=goal,
            reasoning=reasoning,
            secondary_intents=secondary,
        )


__all__ = [
    "Intent",
    "IntentResult",
    "IntentClassifier",
    "ConversationContext",
    "ConversationTurn",
    "KEYWORD_MAP",
]
