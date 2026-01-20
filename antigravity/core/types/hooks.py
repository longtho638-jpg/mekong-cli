"""
Hook TypedDicts - Typed dictionaries for hooks system.
"""

from typing import TypedDict, Optional, Dict


class Win3ScoreDict(TypedDict):
    """Score for a single party in WIN-WIN-WIN validation."""

    score: int
    passed: bool


class Win3ResultDict(TypedDict):
    """Result from WIN-WIN-WIN gate validation."""

    valid: bool
    scores: Dict[str, Win3ScoreDict]
    message: str


class HookResultDict(TypedDict):
    """Result from running a single hook."""

    hook: str
    passed: bool
    output: str
    error: Optional[str]


class DealContextDict(TypedDict, total=False):
    """Deal context passed to hooks."""

    anh: Dict[str, bool]
    agency: Dict[str, bool]
    client: Dict[str, bool]


class HookContextDict(TypedDict, total=False):
    """Context passed to hook execution."""

    deal: DealContextDict
    suite: str
    subcommand: str
    data: Dict[str, object]
