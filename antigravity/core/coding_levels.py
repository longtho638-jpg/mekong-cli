"""
Coding Level Definitions
========================

Level enum, dataclass, and definitions for coding output styles.
"""

from dataclasses import dataclass
from enum import IntEnum
from pathlib import Path
from typing import Any, Dict


class Level(IntEnum):
    """Coding levels from 0 (ELI5) to 5 (GOD)."""

    ELI5 = 0
    JUNIOR = 1
    MID = 2
    SENIOR = 3
    LEAD = 4
    GOD = 5


@dataclass
class CodingLevel:
    """Coding level definition."""

    level: Level
    name: str
    description: str
    style_file: str
    characteristics: Dict[str, Any]


# Base path for style definitions
STYLES_BASE_DIR = Path(".claude/output-styles")


# Level Definitions
LEVELS: Dict[int, CodingLevel] = {
    0: CodingLevel(
        Level.ELI5,
        "ELI5",
        "Explain Like I'm 5 - Maximum simplicity",
        "coding-level-0-eli5.md",
        {
            "code_comments": "Extensive, simple language",
            "variable_names": "Very descriptive, no abbreviations",
            "complexity": "Minimal, step-by-step",
            "explanations": "Every line explained",
            "use_case": "Teaching, documentation, beginners",
        },
    ),
    1: CodingLevel(
        Level.JUNIOR,
        "Junior",
        "Junior developer level - Clear and educational",
        "coding-level-1-junior.md",
        {
            "code_comments": "Frequent with explanations",
            "variable_names": "Descriptive",
            "complexity": "Low, straightforward logic",
            "explanations": "Key concepts explained",
            "use_case": "New team members, learning projects",
        },
    ),
    2: CodingLevel(
        Level.MID,
        "Mid",
        "Mid-level developer - Standard professional",
        "coding-level-2-mid.md",
        {
            "code_comments": "At complex points",
            "variable_names": "Clear and conventional",
            "complexity": "Moderate, uses patterns",
            "explanations": "Non-obvious parts",
            "use_case": "Standard development work",
        },
    ),
    3: CodingLevel(
        Level.SENIOR,
        "Senior",
        "Senior developer - Efficient and robust",
        "coding-level-3-senior.md",
        {
            "code_comments": "Strategic, explains 'why'",
            "variable_names": "Concise but clear",
            "complexity": "Higher, uses advanced patterns",
            "explanations": "Architecture decisions",
            "use_case": "Complex features, refactoring",
        },
    ),
    4: CodingLevel(
        Level.LEAD,
        "Lead",
        "Tech Lead - Architectural and scalable",
        "coding-level-4-lead.md",
        {
            "code_comments": "Minimal, self-documenting code",
            "variable_names": "Domain-driven",
            "complexity": "High, systems thinking",
            "explanations": "Trade-offs and decisions",
            "use_case": "Architecture, critical systems",
        },
    ),
    5: CodingLevel(
        Level.GOD,
        "GOD",
        "God Mode - Maximum performance and elegance",
        "coding-level-5-god.md",
        {
            "code_comments": "Only when truly necessary",
            "variable_names": "Optimal, context-aware",
            "complexity": "Maximum, cutting-edge",
            "explanations": "Innovative approaches only",
            "use_case": "Performance critical, innovation",
        },
    ),
}
