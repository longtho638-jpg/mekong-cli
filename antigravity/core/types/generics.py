"""
Generic Type Variables for Antigravity Core
============================================

Provides reusable TypeVars for generic functions and classes.
Use these instead of Any when the actual type should be preserved.
"""

from typing import TypeVar

# Generic result type - preserves the type of function return values
T = TypeVar("T")

# Generic payload type - for task/message payloads
PayloadT = TypeVar("PayloadT")

# Generic result type for task results
ResultT = TypeVar("ResultT")

# Generic config type for configuration dictionaries
ConfigT = TypeVar("ConfigT")

__all__ = ["T", "PayloadT", "ResultT", "ConfigT"]
