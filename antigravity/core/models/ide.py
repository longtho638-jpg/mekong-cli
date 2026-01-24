"""
🛠️ IDE Models - Planning & Productivity
=======================================

Defines the core data structures for developer experience (DX).
Enables structured implementation planning using Markdown frontmatter
and lightweight task tracking.

Hierarchy:
- Plan: High-level mission blueprint.
- TodoItem: Tactical unit of work.

Binh Pháp: 🛠️ Khí (Tools) - Organizing the workshop.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

# Configure logging
logger = logging.getLogger(__name__)


class PlanDict(TypedDict):
    """Dictionary representation of an implementation plan"""
    title: str
    description: str
    status: str
    priority: str
    effort: str
    branch: Optional[str]
    tags: List[str]
    created: str
    phases: List[str]


class TodoDict(TypedDict):
    """Dictionary representation of a todo item"""
    id: str
    text: str
    completed: bool
    created_at: str


@dataclass
class Plan:
    """
    📜 Strategic Implementation Plan

    Acts as the blueprint for an agent mission.
    Can be serialized to Markdown frontmatter for human/AI collaboration.
    """

    title: str
    description: str
    status: str = "pending"  # pending, in-progress, completed, cancelled
    priority: str = "P2"  # P1 (High), P2 (Medium), P3 (Low)
    effort: str = "4h"  # Estimated duration
    branch: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    created: datetime = field(default_factory=datetime.now)
    phases: List[str] = field(default_factory=list)

    def to_dict(self) -> PlanDict:
        """Serializable representation."""
        return {
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "effort": self.effort,
            "branch": self.branch,
            "tags": self.tags,
            "created": self.created.isoformat(),
            "phases": self.phases,
        }

    def to_frontmatter(self) -> str:
        """Generates YAML frontmatter for inclusion in plan.md files."""
        t_list = ", ".join(self.tags) if self.tags else ""
        return f"""---
title: "{self.title}"
description: "{self.description}"
status: {self.status}
priority: {self.priority}
effort: {self.effort}
branch: {self.branch or "main"}
tags: [{t_list}]
created: {self.created.strftime("%Y-%m-%d")}
---"""


@dataclass
class TodoItem:
    """
    ✅ Tactical Todo

    A simple task unit used for daily tracking and session state.
    """

    id: str
    text: str
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def toggle(self) -> bool:
        """Switches completion state."""
        self.completed = not self.completed
        return self.completed

    def complete(self) -> None:
        """Forces completion state to True."""
        self.completed = True

    def to_markdown(self) -> str:
        """Returns Markdown checkbox string."""
        box = "[x]" if self.completed else "[ ]"
        return f"- {box} {self.text}"

    def to_dict(self) -> TodoDict:
        """Serializable representation."""
        return {
            "id": self.id,
            "text": self.text,
            "completed": self.completed,
            "created_at": self.created_at.isoformat(),
        }
