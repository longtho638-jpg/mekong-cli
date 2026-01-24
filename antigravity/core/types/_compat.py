"""
Python Version Compatibility - TypedDict Import
================================================

This module provides a version-safe TypedDict import that works with:
- Python 3.12+: Uses typing.TypedDict
- Python < 3.12: Uses typing_extensions.TypedDict (required by Pydantic 2.x)

🏯 Binh Pháp: "勝兵先勝而後求戰" - Build infrastructure before battle
"""

import sys

if sys.version_info >= (3, 12):
    from typing import TypedDict
else:
    try:
        from typing_extensions import TypedDict
    except ImportError:
        # Fallback for environments without typing_extensions
        from typing import TypedDict

__all__ = ["TypedDict"]
