"""
Stats TypedDicts - Typed dictionaries for statistics and metrics.
"""

from typing import Dict, TypedDict


class StatsDict(TypedDict, total=False):
    """Generic stats dictionary with common fields."""

    total_count: int
    success_count: int
    error_count: int
    success_rate: float
    duration_ms: float


class OrchestratorStatsDict(TypedDict):
    """Stats returned by AgentOrchestrator.get_stats()."""

    total_runs: int
    success_rate: float
    agent_usage: Dict[str, int]
    session_duration_ms: float


class PipelineStatsDict(TypedDict):
    """Stats returned by SalesPipeline.get_stats()."""

    total_deals: int
    active_deals: int
    won_deals: int
    total_arr: float
    equity_value: float
    pipeline_by_tier: Dict[str, int]


class SwarmMetricsDict(TypedDict):
    """Metrics for swarm operations."""

    total_agents: int
    busy_agents: int
    idle_agents: int
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    avg_task_time: float
    throughput_per_minute: int


class EngineStatsDict(TypedDict, total=False):
    """Base stats for engine implementations."""

    uptime_seconds: float
    total_operations: int
    success_rate: float


class WorkflowStatsDict(TypedDict):
    """Stats for VIBE workflow operations."""

    total_steps: int
    completed_steps: int
    failed_steps: int
    tests_passed: int
    tests_failed: int
    current_phase: str


class ContentStatsDict(TypedDict):
    """Stats for content factory operations."""

    total_ideas: int
    published_count: int
    pending_count: int
    platforms: Dict[str, int]


class RevenueStatsDict(TypedDict, total=False):
    """Stats for revenue engine operations."""

    monthly_target: float
    current_revenue: float
    progress_percent: float
    active_streams: int
    projected_arr: float


class TracingMetricsDict(TypedDict):
    """Metrics from tracing system."""

    total_spans: int
    active_spans: int
    avg_duration_ms: float
    error_rate: float


class WorkspaceStatsDict(TypedDict):
    """Workspace stats for VIBE IDE."""

    plans_total: int
    has_active_plan: bool


class TaskStatsDict(TypedDict):
    """Task counts for VIBE IDE."""

    pending: int
    completed: int


class IDEStatsDict(TypedDict):
    """Stats returned by VIBEIDE.get_stats()."""

    workspace: WorkspaceStatsDict
    tasks: TaskStatsDict


class QualityStatsDict(TypedDict):
    """Quality gate stats for VIBE workflow."""

    tests_passed: bool
    review_score: int


class TaskCountDict(TypedDict):
    """Task count summary."""

    total: int
    done: int


class VIBEWorkflowStatsDict(TypedDict):
    """Stats returned by VIBEWorkflow.get_stats()."""

    current_step: str
    tasks: TaskCountDict
    quality: QualityStatsDict


class InventoryDict(TypedDict):
    """Inventory counts for agentic dashboard."""

    agents: int
    chains: int
    crews: int


class IPDict(TypedDict):
    """Intellectual property counts for agentic dashboard."""

    skills: int
    skill_mappings: int
    rules: int
    rule_assignments: int
    hooks: int


class CognitionDict(TypedDict):
    """Cognition stats for agentic dashboard."""

    memories: int
    patterns: int
    success_rate: float


class ConfigurationDict(TypedDict):
    """Configuration for agentic dashboard."""

    coding_level: int
    level_name: str


class AgenticDashboardStatsDict(TypedDict):
    """Stats returned by AgenticDashboard.get_stats()."""

    inventory: InventoryDict
    ip: IPDict
    cognition: CognitionDict
    configuration: ConfigurationDict


class PlanListItemDict(TypedDict):
    """Single plan item in list_plans result."""

    id: str
    title: str
    path: str
    modified: object  # datetime object

