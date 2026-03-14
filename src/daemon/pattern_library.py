"""
Pattern Library — Store and match patterns from past missions.

Features:
- Pattern extraction from successful missions
- Similarity matching for problem solving
- Pattern categorization by error type
- Confidence scoring for matches

Usage:
  library = PatternLibrary()
  library.add_pattern(error="build failed", solution="npm run build --fix")
  match = library.find_similar("build is broken")
  if match:
      print(f"Try: {match.solution}")
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"
JOURNAL_DIR = MEKONG_DIR / "journal"
PATTERNS_FILE = JOURNAL_DIR / "patterns.json"

# Ensure directory exists
JOURNAL_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class Pattern:
    """A pattern extracted from past missions."""

    id: str
    error_pattern: str  # Regex pattern for matching errors
    solution: str  # Command or action to fix
    category: str  # build, test, security, import, etc.
    success_count: int = 1
    failure_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_matched: str | None = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def confidence(self) -> float:
        """Calculate confidence score based on success/failure ratio."""
        total = self.success_count + self.failure_count
        if total == 0:
            return 0.5
        return self.success_count / total

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "error_pattern": self.error_pattern,
            "solution": self.solution,
            "category": self.category,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "created_at": self.created_at,
            "last_matched": self.last_matched,
            "tags": self.tags,
            "metadata": self.metadata,
            "confidence": round(self.confidence, 2),
        }


@dataclass
class PatternMatch:
    """Result of pattern matching."""

    pattern: Pattern
    confidence: float
    matched_text: str


class PatternLibrary:
    """
    Library of patterns for intelligent problem solving.

    Patterns are extracted from:
    - Successful mission completions
    - Auto-fix successes
    - Human-verified solutions

    Matching uses:
    - Keyword overlap
    - Pattern similarity
    - Category matching
    """

    # Predefined patterns for common issues
    BUILTIN_PATTERNS: list[Pattern] = [
        Pattern(
            id="build-fix",
            error_pattern=r"build failed|compilation error|SyntaxError",
            solution="npm run build --fix",
            category="build",
            tags=["build", "compile", "syntax"],
        ),
        Pattern(
            id="test-snapshot",
            error_pattern=r"snapshot test failed|assertion error",
            solution="npm test -- --updateSnapshot",
            category="test",
            tags=["test", "snapshot", "jest"],
        ),
        Pattern(
            id="npm-install",
            error_pattern=r"ModuleNotFoundError|Cannot find module|import error",
            solution="npm install",
            category="import",
            tags=["import", "module", "dependency"],
        ),
        Pattern(
            id="audit-fix",
            error_pattern=r"security vulnerability|npm audit|CVE-",
            solution="npm audit fix",
            category="security",
            tags=["security", "audit", "vulnerability"],
        ),
        Pattern(
            id="git-reset",
            error_pattern=r"git failed|merge conflict|HEAD detached",
            solution="git reset --hard HEAD",
            category="git",
            tags=["git", "reset", "conflict"],
        ),
    ]

    def __init__(self) -> None:
        self._patterns: dict[str, Pattern] = {}
        self._load()

        # Add builtin patterns if not loaded
        for pattern in self.BUILTIN_PATTERNS:
            if pattern.id not in self._patterns:
                self._patterns[pattern.id] = pattern

    def _load(self) -> None:
        """Load patterns from disk."""
        if not PATTERNS_FILE.exists():
            return

        try:
            data = json.loads(PATTERNS_FILE.read_text())
            for p_data in data.get("patterns", []):
                pattern = Pattern(
                    id=p_data["id"],
                    error_pattern=p_data["error_pattern"],
                    solution=p_data["solution"],
                    category=p_data["category"],
                    success_count=p_data.get("success_count", 1),
                    failure_count=p_data.get("failure_count", 0),
                    created_at=p_data.get("created_at", ""),
                    last_matched=p_data.get("last_matched"),
                    tags=p_data.get("tags", []),
                    metadata=p_data.get("metadata", {}),
                )
                self._patterns[pattern.id] = pattern
            logger.info(f"[PatternLibrary] Loaded {len(self._patterns)} patterns")
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"[PatternLibrary] Failed to load patterns: {e}")

    def _save(self) -> None:
        """Save patterns to disk."""
        data = {
            "patterns": [p.to_dict() for p in self._patterns.values()],
            "last_updated": datetime.now().isoformat(),
        }
        PATTERNS_FILE.write_text(json.dumps(data, indent=2))

    def add_pattern(
        self,
        error: str,
        solution: str,
        category: str = "general",
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Pattern:
        """
        Add a new pattern to the library.

        Args:
            error: Error text (will be converted to regex pattern)
            solution: Solution command or action
            category: Pattern category
            tags: Optional tags for categorization
            metadata: Additional metadata

        Returns:
            The created Pattern object.
        """
        # Create a regex pattern from error text
        pattern_text = self._text_to_regex(error)
        pattern_id = f"{category}-{len(self._patterns) + 1}"

        pattern = Pattern(
            id=pattern_id,
            error_pattern=pattern_text,
            solution=solution,
            category=category,
            tags=tags or [],
            metadata=metadata or {},
        )

        self._patterns[pattern_id] = pattern
        self._save()

        logger.info(f"[PatternLibrary] Added pattern {pattern_id} ({category})")
        return pattern

    def record_success(self, pattern_id: str) -> None:
        """Record a successful pattern match."""
        if pattern_id in self._patterns:
            self._patterns[pattern_id].success_count += 1
            self._patterns[pattern_id].last_matched = datetime.now().isoformat()
            self._save()

    def record_failure(self, pattern_id: str) -> None:
        """Record a failed pattern match."""
        if pattern_id in self._patterns:
            self._patterns[pattern_id].failure_count += 1
            self._save()

    def find_similar(self, error_text: str, min_confidence: float = 0.5) -> PatternMatch | None:
        """
        Find the most similar pattern for the given error.

        Args:
            error_text: Error message to match
            min_confidence: Minimum confidence threshold

        Returns:
            Best matching PatternMatch or None.
        """
        best_match: PatternMatch | None = None
        best_score = 0.0

        for pattern in self._patterns.values():
            score = self._calculate_similarity(error_text, pattern)

            if score > best_score and score >= min_confidence:
                best_score = score
                best_match = PatternMatch(
                    pattern=pattern,
                    confidence=score,
                    matched_text=error_text,
                )

        if best_match:
            logger.info(
                f"[PatternLibrary] Found match: {best_match.pattern.id} (confidence={best_match.confidence:.2f})"
            )
            best_match.pattern.last_matched = datetime.now().isoformat()
            self._save()

        return best_match

    def _calculate_similarity(self, text: str, pattern: Pattern) -> float:
        """
        Calculate similarity score between text and pattern.

        Factors:
        - Regex match score
        - Keyword overlap
        - Category boost
        """
        score = 0.0

        # Regex match (highest weight)
        try:
            if re.search(pattern.error_pattern, text, re.IGNORECASE):
                score += 0.5
        except re.error:
            pass

        # Keyword overlap
        text_words = set(text.lower().split())
        for tag in pattern.tags:
            if tag.lower() in text_words:
                score += 0.15

        # Category keyword in error
        if pattern.category.lower() in text.lower():
            score += 0.15

        # Confidence boost
        score *= pattern.confidence

        return min(score, 1.0)

    def _text_to_regex(self, text: str) -> str:
        """Convert error text to a simple regex pattern."""
        # Escape special regex chars except for common ones
        escaped = re.escape(text)
        # Allow flexible whitespace
        escaped = escaped.replace(r"\ ", r"\s+")
        # Allow any characters in place of specific values
        escaped = escaped.replace(r"\d+", r"\\d+")
        return f".*{escaped}.*"

    def get_patterns(self, category: str | None = None) -> list[dict]:
        """Get all patterns, optionally filtered by category."""
        patterns = self._patterns.values()
        if category:
            patterns = [p for p in patterns if p.category == category]

        return [p.to_dict() for p in sorted(patterns, key=lambda p: p.confidence, reverse=True)]

    def get_stats(self) -> dict[str, Any]:
        """Get pattern library statistics."""
        total = len(self._patterns)
        avg_confidence = sum(p.confidence for p in self._patterns.values()) / total if total > 0 else 0

        return {
            "total_patterns": total,
            "avg_confidence": round(avg_confidence, 2),
            "by_category": self._count_by_category(),
            "high_confidence": sum(1 for p in self._patterns.values() if p.confidence >= 0.8),
        }

    def _count_by_category(self) -> dict[str, int]:
        """Count patterns by category."""
        counts: dict[str, int] = {}
        for pattern in self._patterns.values():
            counts[pattern.category] = counts.get(pattern.category, 0) + 1
        return counts

    def delete_pattern(self, pattern_id: str) -> bool:
        """Delete a pattern by ID."""
        if pattern_id in self._patterns:
            del self._patterns[pattern_id]
            self._save()
            logger.info(f"[PatternLibrary] Deleted pattern {pattern_id}")
            return True
        return False

    def clear(self) -> None:
        """Clear all custom patterns (keeps builtins)."""
        builtin_ids = {p.id for p in self.BUILTIN_PATTERNS}
        self._patterns = {k: v for k, v in self._patterns.items() if k in builtin_ids}
        self._save()
        logger.info("[PatternLibrary] Cleared custom patterns")
