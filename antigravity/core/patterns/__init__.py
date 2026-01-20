"""
Patterns Module - Common design patterns for Antigravity.

Provides reusable factories and decorators for consistent implementation.
"""

from .singleton import singleton_factory
from .persistence import BasePersistence

__all__ = ["singleton_factory", "BasePersistence"]
