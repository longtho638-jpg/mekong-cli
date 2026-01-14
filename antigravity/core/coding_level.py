"""
🎚️ Coding Level - Output Style Controller

Switch between coding levels from ELI5 to GOD mode.
Each level adjusts code complexity and explanation depth.

Usage:
    from antigravity.core.coding_level import CodingLevel, set_level
    set_level(5)  # GOD mode
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import IntEnum
from pathlib import Path


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


# Level Definitions
LEVELS: Dict[int, CodingLevel] = {
    0: CodingLevel(
        Level.ELI5, "ELI5",
        "Explain Like I'm 5 - Maximum simplicity",
        "coding-level-0-eli5.md",
        {
            "code_comments": "Extensive, simple language",
            "variable_names": "Very descriptive, no abbreviations",
            "complexity": "Minimal, step-by-step",
            "explanations": "Every line explained",
            "use_case": "Teaching, documentation, beginners",
        }
    ),
    1: CodingLevel(
        Level.JUNIOR, "Junior",
        "Junior developer level - Clear and educational",
        "coding-level-1-junior.md",
        {
            "code_comments": "Frequent with explanations",
            "variable_names": "Descriptive",
            "complexity": "Low, straightforward logic",
            "explanations": "Key concepts explained",
            "use_case": "New team members, learning projects",
        }
    ),
    2: CodingLevel(
        Level.MID, "Mid",
        "Mid-level developer - Standard professional",
        "coding-level-2-mid.md",
        {
            "code_comments": "At complex points",
            "variable_names": "Clear and conventional",
            "complexity": "Moderate, uses patterns",
            "explanations": "Non-obvious parts",
            "use_case": "Standard development work",
        }
    ),
    3: CodingLevel(
        Level.SENIOR, "Senior",
        "Senior developer - Efficient and robust",
        "coding-level-3-senior.md",
        {
            "code_comments": "Strategic, explains 'why'",
            "variable_names": "Concise but clear",
            "complexity": "Higher, uses advanced patterns",
            "explanations": "Architecture decisions",
            "use_case": "Complex features, refactoring",
        }
    ),
    4: CodingLevel(
        Level.LEAD, "Lead",
        "Tech Lead - Architectural and scalable",
        "coding-level-4-lead.md",
        {
            "code_comments": "Minimal, self-documenting code",
            "variable_names": "Domain-driven",
            "complexity": "High, systems thinking",
            "explanations": "Trade-offs and decisions",
            "use_case": "Architecture, critical systems",
        }
    ),
    5: CodingLevel(
        Level.GOD, "GOD",
        "God Mode - Maximum performance and elegance",
        "coding-level-5-god.md",
        {
            "code_comments": "Only when truly necessary",
            "variable_names": "Optimal, context-aware",
            "complexity": "Maximum, cutting-edge",
            "explanations": "Innovative approaches only",
            "use_case": "Performance critical, innovation",
        }
    ),
}


# Current level (default: SENIOR)
_current_level: int = 3


def get_level() -> CodingLevel:
    """Get current coding level."""
    return LEVELS[_current_level]


def set_level(level: int) -> CodingLevel:
    """Set coding level (0-5)."""
    global _current_level
    if level < 0 or level > 5:
        raise ValueError("Level must be between 0 and 5")
    _current_level = level
    return LEVELS[level]


def get_level_prompt(level: int = None) -> str:
    """Get the coding style prompt for a level."""
    if level is None:
        level = _current_level
    
    lvl = LEVELS.get(level)
    if not lvl:
        return ""
    
    return f"""
## Coding Style: {lvl.name} (Level {lvl.level})

{lvl.description}

### Characteristics:
- Comments: {lvl.characteristics['code_comments']}
- Variable Names: {lvl.characteristics['variable_names']}
- Complexity: {lvl.characteristics['complexity']}
- Explanations: {lvl.characteristics['explanations']}
"""


def load_level_style(level: int = None, base_path: str = ".claude/output-styles") -> str:
    """Load the full style definition from file."""
    if level is None:
        level = _current_level
    
    lvl = LEVELS.get(level)
    if not lvl:
        return ""
    
    style_path = Path(base_path) / lvl.style_file
    if style_path.exists():
        return style_path.read_text()
    return ""


def print_levels():
    """Print all coding levels."""
    print("\n🎚️ CODING LEVELS")
    print("═" * 60)
    
    for level, info in LEVELS.items():
        current = "⭐" if level == _current_level else "  "
        print(f"   {current} Level {level}: {info.name}")
        print(f"      └── {info.description}")
    
    print()
    print(f"   Current: Level {_current_level} ({LEVELS[_current_level].name})")
    print("═" * 60)


def print_current_level():
    """Print current level details."""
    lvl = get_level()
    print(f"\n🎚️ CURRENT LEVEL: {lvl.level} - {lvl.name}")
    print("─" * 40)
    print(f"   {lvl.description}")
    print()
    for key, value in lvl.characteristics.items():
        print(f"   • {key}: {value}")
    print()
