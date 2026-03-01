"""
Mekong Daemon - Complexity Classifier

Keyword-based mission routing. Configurable via YAML.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_KEYWORDS = {
    "simple": {"keywords": ["add", "update", "fix", "rename", "remove"], "timeout": 900},
    "medium": {"keywords": ["implement", "create", "migrate", "optimize"], "timeout": 1800},
    "complex": {"keywords": ["refactor", "redesign", "architecture", "rewrite"], "timeout": 3600},
    "strategic": {"keywords": ["audit", "overhaul", "platform", "infrastructure"], "timeout": 5400},
}


@dataclass
class ClassificationResult:
    """Mission complexity classification."""
    level: str
    timeout: int
    matched_keyword: Optional[str] = None


class ComplexityClassifier:
    """
    Classifies mission text by complexity using keyword matching.

    Args:
        keyword_config: Dict of level → {keywords, timeout}
    """

    def __init__(self, keyword_config: Optional[Dict] = None) -> None:
        self._config = keyword_config or DEFAULT_KEYWORDS

    def classify(self, text: str) -> ClassificationResult:
        """Classify mission text. Returns highest matching complexity."""
        text_lower = text.lower()
        levels = ["strategic", "complex", "medium", "simple"]

        for level in levels:
            cfg = self._config.get(level, {})
            keywords = cfg.get("keywords", [])
            for kw in keywords:
                if kw in text_lower:
                    return ClassificationResult(
                        level=level,
                        timeout=cfg.get("timeout", 1800),
                        matched_keyword=kw,
                    )

        return ClassificationResult(level="simple", timeout=900)


__all__ = ["ComplexityClassifier", "ClassificationResult"]
