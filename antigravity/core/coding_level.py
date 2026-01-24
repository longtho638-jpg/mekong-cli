"""
Coding Level - Output Style Controller
=======================================

Switch between coding levels from ELI5 to GOD mode.
Each level adjusts code complexity, explanation depth, and commenting style.

Usage:
    from antigravity.core.coding_level import set_level, get_level_prompt
    set_level(3)  # Senior Dev mode
    prompt = get_level_prompt()
"""

import logging
from pathlib import Path
from typing import Optional

# Import level definitions from modular file
from .coding_levels import LEVELS, STYLES_BASE_DIR, CodingLevel, Level

logger = logging.getLogger(__name__)

# Re-export for backward compatibility
__all__ = [
    "Level",
    "CodingLevel",
    "LEVELS",
    "STYLES_BASE_DIR",
    "get_level",
    "set_level",
    "get_level_prompt",
    "load_level_style",
    "print_levels",
    "print_current_level",
]

# Current level (default: SENIOR)
_current_level: int = 3


def get_level() -> CodingLevel:
    """Get current coding level."""
    return LEVELS.get(_current_level, LEVELS[3])


def set_level(level: int) -> CodingLevel:
    """Set coding level (0-5)."""
    global _current_level
    if not isinstance(level, int) or level < 0 or level > 5:
        raise ValueError("Level must be an integer between 0 and 5")
    _current_level = level
    return LEVELS[level]


def get_level_prompt(level: Optional[int] = None) -> str:
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
- Comments: {lvl.characteristics["code_comments"]}
- Variable Names: {lvl.characteristics["variable_names"]}
- Complexity: {lvl.characteristics["complexity"]}
- Explanations: {lvl.characteristics["explanations"]}
"""


def load_level_style(level: Optional[int] = None, base_path: Path = STYLES_BASE_DIR) -> str:
    """Load the full style definition from file."""
    if level is None:
        level = _current_level

    lvl = LEVELS.get(level)
    if not lvl:
        return ""

    if isinstance(base_path, str):
        base_path = Path(base_path)

    style_path = base_path / lvl.style_file
    if style_path.exists():
        try:
            return style_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.warning(f"Failed to read style file {style_path}: {e}")
            return ""
    return ""


def print_levels():
    """Print all coding levels."""
    print("\nCODING LEVELS")
    print("=" * 60)

    for level, info in LEVELS.items():
        current = "*" if level == _current_level else " "
        print(f"   {current} Level {level}: {info.name}")
        print(f"      - {info.description}")

    print()
    print(f"   Current: Level {_current_level} ({LEVELS[_current_level].name})")
    print("=" * 60)


def print_current_level():
    """Print current level details."""
    lvl = get_level()
    print(f"\nCURRENT LEVEL: {lvl.level} - {lvl.name}")
    print("-" * 40)
    print(f"   {lvl.description}")
    print()
    for key, value in lvl.characteristics.items():
        print(f"   * {key}: {value}")
    print()
