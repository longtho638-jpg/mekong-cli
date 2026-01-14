"""
IDE models for VIBEIDE.

Extracted from vibe_ide.py for clean architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List


@dataclass
class Plan:
    """Implementation plan structure."""
    title: str
    description: str
    status: str = "pending"  # pending, in-progress, completed
    priority: str = "P2"  # P1, P2, P3
    effort: str = "4h"
    branch: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    created: datetime = field(default_factory=datetime.now)
    phases: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "effort": self.effort,
            "branch": self.branch,
            "tags": self.tags,
            "created": self.created.isoformat(),
            "phases": self.phases
        }

    def to_frontmatter(self) -> str:
        """Generate YAML frontmatter."""
        tags_str = ', '.join(self.tags) if self.tags else ''
        return f"""---
title: "{self.title}"
description: "{self.description}"
status: {self.status}
priority: {self.priority}
effort: {self.effort}
branch: {self.branch or 'main'}
tags: [{tags_str}]
created: {self.created.strftime('%Y-%m-%d')}
---"""


@dataclass
class TodoItem:
    """Todo item for task tracking."""
    id: str
    text: str
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def toggle(self) -> None:
        """Toggle completion status."""
        self.completed = not self.completed

    def complete(self) -> None:
        """Mark as completed."""
        self.completed = True

    def to_markdown(self) -> str:
        """Convert to markdown checkbox."""
        checkbox = "[x]" if self.completed else "[ ]"
        return f"- {checkbox} {self.text}"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "text": self.text,
            "completed": self.completed,
            "created_at": self.created_at.isoformat()
        }
