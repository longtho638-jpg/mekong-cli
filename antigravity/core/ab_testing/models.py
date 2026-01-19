"""
AB Testing Models - Data classes and enums.

Shared types for the AB testing engine:
- TestResult: Statistical test result types
- AllocationStrategy: Traffic allocation strategies
- StatisticalTest: Test configuration and results
- ABVariant: Enhanced A/B test variant
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Statistical imports (with fallbacks)
try:
    import pymc as mc  # noqa: F401
    from scipy import stats as scipy_stats  # noqa: F401
    from scipy.stats import chi2_contingency  # noqa: F401

    STATISTICAL_LIBS_AVAILABLE = True
except ImportError:
    STATISTICAL_LIBS_AVAILABLE = False
    logger.warning("Advanced statistical libraries not available, using basic statistics")


class TestResult(Enum):
    """Statistical test result types."""

    CONTROL_WINS = "control_wins"
    VARIANT_WINS = "variant_wins"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"
    EARLY_STOP = "early_stop"


class AllocationStrategy(Enum):
    """Traffic allocation strategies."""

    EQUAL_RANDOM = "equal_random"
    THOMPSON_SAMPLING = "thompson_sampling"
    BANDIT = "bandit"
    ADAPTIVE = "adaptive"


@dataclass
class StatisticalTest:
    """Statistical test configuration and results."""

    test_id: str
    name: str
    hypothesis: str
    alpha: float = 0.05  # Significance level
    power: float = 0.8  # Statistical power
    test_statistic: str = "conversion_rate"
    p_value: Optional[float] = None
    confidence_interval: Optional[Tuple[float, float]] = None
    test_result: Optional[TestResult] = None
    effect_size: Optional[float] = None
    bayes_factor: Optional[float] = None
    sample_size: int = 0
    conversions: Dict[str, int] = field(default_factory=dict)
    revenue: Dict[str, float] = field(default_factory=dict)
    start_time: float = 0.0
    end_time: Optional[float] = None
    statistical_significance: bool = False


@dataclass
class ABVariant:
    """Enhanced A/B test variant."""

    variant_id: str
    name: str
    config: Dict[str, Any]
    traffic_allocation: float = 0.0
    conversion_rate: float = 0.0
    revenue_per_user: float = 0.0
    confidence_interval: Optional[Tuple[float, float]] = None
    statistical_significance: bool = False
    optimal_price: Optional[float] = None


__all__ = [
    "TestResult",
    "AllocationStrategy",
    "StatisticalTest",
    "ABVariant",
    "STATISTICAL_LIBS_AVAILABLE",
]
