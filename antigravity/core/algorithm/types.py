"""
Type definitions for Antigravity Algorithm.

Consolidated from models.py - all data models and types in one place.
"""
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class PricingStrategy(Enum):
    """Enhanced pricing strategies."""
    PENETRATION = "penetration"  # Low price to gain market
    PREMIUM = "premium"  # High value positioning
    FREEMIUM = "freemium"  # Free tier + paid upgrade
    VIRAL_COEFFICIENT = "viral"  # Optimized for growth
    ENTERPRISE = "enterprise"  # Custom pricing
    ML_OPTIMIZED = "ml_optimized"  # Machine learning optimized
    AB_TEST = "ab_test"  # A/B testing enabled


class WinType(Enum):
    """WIN-WIN-WIN validation types."""
    ANH_WIN = "anh"  # Owner revenue/equity
    AGENCY_WIN = "agency"  # Knowledge/infrastructure
    STARTUP_WIN = "startup"  # Value/protection


class ABTestVariant(Enum):
    """A/B test variant types."""
    CONTROL = "control"
    VARIANT_A = "variant_a"
    VARIANT_B = "variant_b"
    MULTIVARIATE = "multivariate"

class ModelConfidence(Enum):
    """Prediction confidence levels."""
    VERY_LOW = "very_low"  # < 50%
    LOW = "low"  # 50-65%
    MEDIUM = "medium"  # 65-80%
    HIGH = "high"  # 80-90%
    VERY_HIGH = "very_high"  # > 90%

@dataclass
class ABTestConfig:
    """A/B test configuration."""
    test_id: str
    name: str
    variants: Dict[str, float]  # variant_name -> price_multiplier
    traffic_split: Dict[str, float]  # variant_name -> percentage (0-1)
    start_time: float
    end_time: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MLModel:
    """ML model for price optimization."""
    model_type: str  # linear, random_forest, neural_network
    features: List[str]
    target: str
    model: Any = None
    scaler: Any = None
    accuracy: float = 0.0
    last_trained: float = 0.0

@dataclass
class ConversionData:
    """Conversion tracking data."""
    timestamp: float
    price_point: float
    conversion: bool  # True if converted
    user_segment: str
    traffic_source: str
    experiment_id: Optional[str] = None
    confidence_score: float = 0.0

class EnhancedPricingContext:
    """Enhanced pricing context with ML features."""

    def __init__(self, base_price: float, features: Dict[str, Any] = None):
        self.base_price = base_price
        self.features = features or {}
        self.ml_features = self._extract_ml_features()

    def _extract_ml_features(self) -> Dict[str, float]:
        """Extract ML-ready features from context."""
        return {
            "base_price": self.base_price,
            "hour_of_day": time.localtime().tm_hour,
            "day_of_week": time.localtime().tm_wday,
            "month": time.localtime().tm_mon,
            "is_weekend": 1 if time.localtime().tm_wday >= 5 else 0,
            "demand_score": self.features.get("demand_factor", 0.0),
            "scarcity_score": self.features.get("scarcity_factor", 0.0),
            "time_urgency": self.features.get("time_factor", 1.0),
            "competitor_price": self.features.get("competitor_price", self.base_price),
            "market_size": self.features.get("market_size", 1000),
            "seasonal_factor": self.features.get("seasonal_factor", 1.0),
        }


@dataclass
class LeadData:
    """Lead qualification data."""
    name: str
    company: str
    budget: int = 0
    authority: int = 0  # 1-10 scale
    need: int = 0  # 1-10 scale
    timeline: int = 0  # 1-10 scale
    source: str = "direct"


@dataclass
class LeadScore:
    """Calculated BANT score."""
    total: int
    grade: str  # A, B, C, D
    qualified: bool
    next_action: str


@dataclass
class PricingContext:
    """Context for dynamic pricing."""
    product: str
    tier: str = "standard"
    tenant_id: str = "default"
    discount_code: Optional[str] = None
    quantity: int = 1


@dataclass
class WinResult:
    """WIN-WIN-WIN validation result."""
    is_valid: bool
    wins: Dict[WinType, str]
    violations: List[str] = field(default_factory=list)
