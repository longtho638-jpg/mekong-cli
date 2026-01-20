"""
Data models for Data Moat.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class InsightType(Enum):
    """Types of market intelligence."""
    BENCHMARK = "benchmark"
    VIRAL_PATTERN = "viral"
    MARKET_TREND = "trend"
    COMPETITOR = "competitor"
    BEST_PRACTICE = "practice"
    STRATEGIC = "strategic"

@dataclass
class Insight:
    """A piece of market intelligence."""
    id: Optional[int] = None
    type: InsightType = InsightType.BENCHMARK
    niche: str = ""
    title: str = ""
    data: Dict = field(default_factory=dict)
    confidence: float = 0.0
    sample_size: int = 0
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class Benchmark:
    """Performance benchmark for a specific niche."""
    niche: str
    avg_revenue: float = 0.0
    avg_clients: int = 0
    avg_conversion_rate: float = 0.0
    top_content_types: List[str] = field(default_factory=list)
    sample_size: int = 0
    last_updated: datetime = field(default_factory=datetime.now)
