"""
Usage Types — Shared types and constants for usage metering.

Part of Phase 6: CLI Integration with RaaS Gateway
"""

from typing import TypedDict, Optional, Any


# =============================================================================
# Type Definitions
# =============================================================================


class UsageMetric(TypedDict, total=False):
    """Usage metric from gateway."""

    event_type: str
    endpoint: str
    method: str
    request_count: int
    input_tokens: int
    output_tokens: int
    duration_ms: int
    payload_size: int
    timestamp: str


class UsageSummary(TypedDict, total=False):
    """Aggregated usage summary."""

    total_requests: int
    total_tokens: int
    total_duration_ms: int
    unique_endpoints: int
    overage_requests: int
    included_quota: int


class TierInfo(TypedDict, total=False):
    """Tier/entitlement information."""

    name: str
    description: str
    quota: int
    rate_limit: int


class EntitlementData(TypedDict, total=False):
    """Entitlement response structure."""

    entitlements: dict[str, Any]
    tier: TierInfo
    billing_cycle_start: Optional[str]
    billing_cycle_end: Optional[str]


class UsageData(TypedDict, total=False):
    """Usage response structure."""

    metrics: list[UsageMetric]
    summary: UsageSummary


class OverageStatus(TypedDict, total=False):
    """Overage payment status."""

    status: str  # pending, invoiced, paid, waived
    overage_rate: float
    next_billing_date: str


class ExportEvent(TypedDict, total=False):
    """Export event structure."""

    event_id: str
    event_type: str
    timestamp: str
    input_tokens: int
    output_tokens: int
    duration_ms: int
    endpoint: str


class ExportData(TypedDict, total=False):
    """Export data structure."""

    exported_at: str
    period: str
    total_events: int
    events: list[ExportEvent]


# =============================================================================
# Constants
# =============================================================================

# Event types
EVENT_TYPE_CLI_COMMAND = "cli:command"
EVENT_TYPE_LLM_CALL = "llm:call"
EVENT_TYPE_AGENT_SPAWN = "agent:spawn"
EVENT_TYPE_USAGE_TOKENS = "usage:tokens"

# Quota thresholds
QUOTA_WARNING_THRESHOLD = 80.0  # 80% triggers warning
QUOTA_CRITICAL_THRESHOLD = 95.0  # 95% triggers critical alert

# Rate limit thresholds
RATE_LIMIT_WARNING = 50  # Below 50 requests triggers warning
RATE_LIMIT_CRITICAL = 10  # Below 10 requests triggers critical alert

# Default quota (for mock data)
DEFAULT_QUOTA = 100_000
DEFAULT_OVERAGE_RATE = 0.001  # $0.001 per request

# Status display mappings
STATUS_DISPLAY_MAP = {
    "pending": (" Pending", "yellow"),
    "invoiced": (" Invoiced", "blue"),
    "paid": (" Paid", "green"),
    "waived": (" Waived", "green"),
}
