"""
Patterns Module - Common design patterns for Antigravity.

Provides reusable factories and decorators for consistent implementation.
"""

from .persistence import BasePersistence
from .singleton import singleton_factory

__all__ = ["singleton_factory", "BasePersistence"]
