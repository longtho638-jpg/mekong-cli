"""
Models package for AntigravityKit.

Extracted data models for clean architecture.
"""

from .invoice import Invoice, InvoiceStatus, Forecast
from .deal import StartupDeal, DealStage
from .win_check import WinCheck, WinType
from .workflow import Task, TaskStatus, WorkflowStep, CodeReviewResult
from .ide import Plan, TodoItem
from .orchestrator import AgentTask, AgentType, ChainResult, ExecutionMode

__all__ = [
    # Invoice
    'Invoice', 'InvoiceStatus', 'Forecast',
    # Deal
    'StartupDeal', 'DealStage',
    # Win Check
    'WinCheck', 'WinType',
    # Workflow
    'Task', 'TaskStatus', 'WorkflowStep', 'CodeReviewResult',
    # IDE
    'Plan', 'TodoItem',
    # Orchestrator
    'AgentTask', 'AgentType', 'ChainResult', 'ExecutionMode',
]
