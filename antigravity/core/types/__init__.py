"""
Type Definitions for Antigravity Core
======================================

Centralized type definitions to eliminate Any types across the codebase.
Provides TypedDicts for complex return values and Protocols for shared interfaces.
"""

from .stats import (
    StatsDict,
    OrchestratorStatsDict,
    PipelineStatsDict,
    SwarmMetricsDict,
    EngineStatsDict,
    WorkflowStatsDict,
    ContentStatsDict,
    RevenueStatsDict,
    TracingMetricsDict,
    WorkspaceStatsDict,
    TaskStatsDict,
    IDEStatsDict,
    QualityStatsDict,
    TaskCountDict,
    VIBEWorkflowStatsDict,
    InventoryDict,
    IPDict,
    CognitionDict,
    ConfigurationDict,
    AgenticDashboardStatsDict,
    PlanListItemDict,
)
from .pipeline import (
    FunnelDict,
    FinancialsDict,
    PipelineBreakdownDict,
    GoalSummaryDict,
)
from .hooks import (
    HookResultDict,
    Win3ResultDict,
    Win3ScoreDict,
    HookContextDict,
    DealContextDict,
)
from .responses import (
    StatusDict,
    SwarmStatusDict,
    AgentStatusDict,
    TestResultDict,
    ShipResultDict,
    AnalyticsSummaryDict,
)
from .config import (
    TierPricingDict,
    VariantConfigDict,
)
from .protocols import (
    HasStats,
    Serializable,
    Configurable,
    HasStatus,
)

__all__ = [
    # Stats TypedDicts
    "StatsDict",
    "OrchestratorStatsDict",
    "PipelineStatsDict",
    "SwarmMetricsDict",
    "EngineStatsDict",
    "WorkflowStatsDict",
    "ContentStatsDict",
    "RevenueStatsDict",
    "TracingMetricsDict",
    "WorkspaceStatsDict",
    "TaskStatsDict",
    "IDEStatsDict",
    "QualityStatsDict",
    "TaskCountDict",
    "VIBEWorkflowStatsDict",
    "InventoryDict",
    "IPDict",
    "CognitionDict",
    "ConfigurationDict",
    "AgenticDashboardStatsDict",
    "PlanListItemDict",
    # Pipeline TypedDicts
    "FunnelDict",
    "FinancialsDict",
    "PipelineBreakdownDict",
    "GoalSummaryDict",
    # Hooks TypedDicts
    "HookResultDict",
    "Win3ResultDict",
    "Win3ScoreDict",
    "HookContextDict",
    "DealContextDict",
    # Response TypedDicts
    "StatusDict",
    "SwarmStatusDict",
    "AgentStatusDict",
    "TestResultDict",
    "ShipResultDict",
    "AnalyticsSummaryDict",
    # Config TypedDicts
    "TierPricingDict",
    "VariantConfigDict",
    # Protocols
    "HasStats",
    "Serializable",
    "Configurable",
    "HasStatus",
]
