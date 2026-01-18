"""
Models package for AntigravityKit.

Extracted data models for clean architecture.
"""

from .deal import DealStage, StartupDeal
from .ide import Plan, TodoItem
from .invoice import Forecast, Invoice, InvoiceStatus
from .orchestrator import AgentTask, AgentType, ChainResult, ExecutionMode
from .win_check import WinCheck, WinType
from .workflow import CodeReviewResult, Task, TaskStatus, WorkflowStep

__all__ = [
    # Invoice
    "Invoice",
    "InvoiceStatus",
    "Forecast",
    # Deal
    "StartupDeal",
    "DealStage",
    # Win Check
    "WinCheck",
    "WinType",
    # Workflow
    "Task",
    "TaskStatus",
    "WorkflowStep",
    "CodeReviewResult",
    # IDE
    "Plan",
    "TodoItem",
    # Orchestrator
    "AgentTask",
    "AgentType",
    "ChainResult",
    "ExecutionMode",
]
