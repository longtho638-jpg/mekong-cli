"""
DEPRECATED: This file is deprecated.

Use backend.api.schemas instead (directory).

Kept for backward compatibility only.
"""

import warnings
from typing import Optional

from pydantic import BaseModel

# Import from new centralized location
from backend.api.schemas import (
    AgentTask,
    CommandRequest,
    VibeRequest,
    VibeResponse,
)

warnings.warn(
    "backend.api.schemas.py is deprecated. Import from backend.api.schemas (directory) instead.",
    DeprecationWarning,
    stacklevel=2
)

# Re-export for backward compatibility
__all__ = [
    "CommandRequest",
    "AgentTask",
    "VibeRequest",
    "VibeResponse",
]

