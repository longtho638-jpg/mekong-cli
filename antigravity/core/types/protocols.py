"""
Protocol Classes - Structural subtyping interfaces.
"""

from typing import Dict, Protocol


class HasStats(Protocol):
    """Protocol for objects that provide statistics."""

    def get_stats(self) -> Dict[str, object]:
        """Return statistics dictionary."""
        ...


class HasStatus(Protocol):
    """Protocol for objects that provide status."""

    def get_status(self) -> Dict[str, object]:
        """Return status dictionary."""
        ...


class Serializable(Protocol):
    """Protocol for serializable objects."""

    def to_dict(self) -> Dict[str, object]:
        """Serialize to dictionary."""
        ...


class Configurable(Protocol):
    """Protocol for configurable objects."""

    def configure(self, config: Dict[str, object]) -> None:
        """Apply configuration."""
        ...
