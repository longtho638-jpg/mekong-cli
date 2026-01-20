"""Platform package - Network effects and moat systems."""

# Lazy imports to avoid circular dependencies
from .memory import Memory, get_memory

__all__ = ["Memory", "get_memory"]
