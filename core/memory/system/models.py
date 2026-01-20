"""
Data models for Memory System.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Observation:
    """A memory observation."""
    id: Optional[int] = None
    session_id: str = ""
    type: str = "note"  # 'code', 'error', 'decision', 'note'
    content: str = ""
    summary: str = ""
    created_at: str = ""
