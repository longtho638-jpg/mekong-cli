"""
Response TypedDicts - Typed dictionaries for API responses.
"""

from typing import TypedDict, Dict, Optional, List


class AgentStatusDict(TypedDict):
    """Status of a single agent in swarm."""

    name: str
    role: str
    busy: bool
    completed: int
    failed: int


class SwarmInnerMetricsDict(TypedDict):
    """Inner metrics for swarm status."""

    total_agents: int
    busy_agents: int
    completed_tasks: int
    failed_tasks: int
    avg_task_time: float


class SwarmStatusDict(TypedDict):
    """Status returned by AgentSwarm.get_status()."""

    running: bool
    agents: Dict[str, AgentStatusDict]
    pending_tasks: int
    metrics: SwarmInnerMetricsDict


class StatusDict(TypedDict, total=False):
    """Generic status dictionary."""

    active: bool
    healthy: bool
    message: str
    uptime_seconds: float


class TestResultDict(TypedDict):
    """Result from running tests."""

    passed: bool
    total_tests: int
    passed_tests: int
    failed_tests: int
    duration_seconds: float
    output: str


class ShipResultDict(TypedDict):
    """Result from shipping changes."""

    success: bool
    commit_hash: Optional[str]
    message: str
    files_changed: int


class AnalyticsSummaryDict(TypedDict):
    """Analytics summary for a time period."""

    total_events: int
    unique_users: int
    top_events: Dict[str, int]
    avg_events_per_user: float
    period_days: int


class CalendarItemDict(TypedDict):
    """Single item in content calendar."""

    date: str
    idea_id: str
    platform: str
    title: str
    status: str


class PlanItemDict(TypedDict):
    """Single plan item in VIBE IDE."""

    path: str
    name: str
    status: str
    created_at: str
    phases: List[str]


class TaskPerformanceDict(TypedDict):
    """Performance metrics for an agent task."""

    duration: float
    priority: int


class AgentTaskDict(TypedDict):
    """Serialized AgentTask representation."""

    agent: str
    description: str
    status: str
    performance: TaskPerformanceDict
    output_preview: Optional[str]


class ChainMetricsDict(TypedDict):
    """Metrics for chain result."""

    done: int
    fail: int
    total: int


class ChainResultDict(TypedDict):
    """Serialized ChainResult representation."""

    success: bool
    total_time_sec: float
    mission_metrics: ChainMetricsDict
    errors: List[str]


class SpanEventDict(TypedDict):
    """Serialized SpanEvent representation."""

    name: str
    timestamp: str
    attributes: Dict[str, object]


class SpanDict(TypedDict):
    """Serialized Span representation for export."""

    traceId: str
    spanId: str
    parentSpanId: Optional[str]
    name: str
    kind: str
    status: str
    startTime: str
    endTime: Optional[str]
    duration_ms: float
    attributes: Dict[str, object]
    events: List[SpanEventDict]
