"""
Pipeline TypedDicts - Typed dictionaries for sales pipeline data.
"""

from ._compat import TypedDict


class FunnelDict(TypedDict):
    """Funnel metrics for pipeline breakdown."""

    active_count: int
    won_count: int
    conversion_rate: float


class FinancialsDict(TypedDict):
    """Financial metrics for pipeline breakdown."""

    current_arr: float
    equity_paper_value: float
    potential_success_fees: float


class PipelineBreakdownDict(TypedDict):
    """Complete pipeline breakdown returned by get_pipeline_breakdown()."""

    funnel: FunnelDict
    financials: FinancialsDict


class GoalSummaryDict(TypedDict):
    """Revenue goal summary."""

    target_arr: float
    current_arr: float
    progress_percent: float
    remaining: float
    on_track: bool
