"""
MCP Server Models.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class MCPResponse:
    """Standard MCP response format."""

    success: bool
    data: Any
    message: str = ""
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
