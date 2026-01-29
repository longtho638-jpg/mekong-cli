"""
Task Manager Agent - Project & Task Tracking (Proxy)
================================================
This file is now a proxy for the modularized version in ./task_logic/
Please import from backend.agents.adminops.task_logic instead.
"""

import warnings

from .task_logic import Project, Task, TaskManagerAgent, TaskPriority, TaskStatus

# Issue a deprecation warning
warnings.warn(
    "backend.agents.adminops.task_manager_agent is deprecated. "
    "Use backend.agents.adminops.task_logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
