"""
Type Definitions for Antigravity Core
======================================

Centralized type definitions to eliminate Any types across the codebase.
Provides TypedDicts for complex return values and Protocols for shared interfaces.
"""

from .config import (
    TierPricingDict,
    VariantConfigDict,
)
from .generics import (
    ConfigT,
    PayloadT,
    ResultT,
    T,
)
from .hooks import (
    DealContextDict,
    HookContextDict,
    HookResultDict,
    Win3ResultDict,
    Win3ScoreDict,
)
from .pipeline import (
    FinancialsDict,
    FunnelDict,
    GoalSummaryDict,
    PipelineBreakdownDict,
)
from .protocols import (
    Configurable,
    HasStats,
    HasStatus,
    Serializable,
)
from .responses import (
    AgentStatusDict,
    AgentTaskDict,
    AnalyticsSummaryDict,
    ChainMetricsDict,
    ChainResultDict,
    ShipResultDict,
    SpanDict,
    SpanEventDict,
    StatusDict,
    SwarmStatusDict,
    TaskPerformanceDict,
    TestResultDict,
)
from .stats import (
    AgenticDashboardStatsDict,
    CognitionDict,
    ConfigurationDict,
    ContentStatsDict,
    EngineStatsDict,
    IDEStatsDict,
    InventoryDict,
    IPDict,
    OrchestratorStatsDict,
    PipelineStatsDict,
    PlanListItemDict,
    QualityStatsDict,
    RevenueStatsDict,
    StatsDict,
    SwarmMetricsDict,
    TaskCountDict,
    TaskStatsDict,
    TracingMetricsDict,
    VIBEWorkflowStatsDict,
    WorkflowStatsDict,
    WorkspaceStatsDict,
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
    "AgentTaskDict",
    "TaskPerformanceDict",
    "ChainMetricsDict",
    "ChainResultDict",
    "SpanEventDict",
    "SpanDict",
    # Config TypedDicts
    "TierPricingDict",
    "VariantConfigDict",
    # Protocols
    "HasStats",
    "Serializable",
    "Configurable",
    "HasStatus",
    # Generics
    "T",
    "PayloadT",
    "ResultT",
    "ConfigT",
]
