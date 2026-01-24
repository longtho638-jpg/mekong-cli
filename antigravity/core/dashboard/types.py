"""
Dashboard Types
===============
Data definitions for the Master Dashboard.
"""
from typing_extensions import TypedDict


class AgenticLayerDict(TypedDict):
    agents_active: int
    success_rate: float


class RetentionLayerDict(TypedDict):
    moat_strength: int
    loyalty_tier: str
    switching_cost_usd: float


class RevenueLayerDict(TypedDict):
    arr: float
    progress: float


class InfraLayerDict(TypedDict):
    health: int
    layers_online: int


class MasterLayersDict(TypedDict):
    agentic: AgenticLayerDict
    retention: RetentionLayerDict
    revenue: RevenueLayerDict
    infra: InfraLayerDict


class MasterSummaryDict(TypedDict):
    """Unified system summary"""
    timestamp: str
    score: int
    layers: MasterLayersDict
