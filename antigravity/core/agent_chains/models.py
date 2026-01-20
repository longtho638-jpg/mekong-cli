"""
🏯 Agent Chains Models
=====================

Data models for agent configuration and categorization.
"""

from enum import Enum
from pathlib import Path
from typing import NamedTuple


class AgentCategory(Enum):
    """Categorization for agents to organize the workbench."""

    DEVELOPMENT = "development"
    BUSINESS = "business"
    CONTENT = "content"
    DESIGN = "design"
    EXTERNAL = "external"


class AgentConfig(NamedTuple):
    """Configuration for a single agent."""

    category: AgentCategory
    file: Path
