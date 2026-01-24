"""
Revenue AI - Main Engine.
=========================

AI-Driven Revenue Optimization orchestrator.
"""

import logging
import threading
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from ..models import (
    ChurnPrediction,
    CustomerProfile,
    PricingRecommendation,
    RevenueMetrics,
    UpsellRecommendation,
)
from .churn_predictor import ChurnPredictor
from .metrics_calculator import MetricsCalculator
from .price_optimizer import PriceOptimizer
from .upsell_detector import UpsellDetector

logger = logging.getLogger(__name__)


class RevenueAIStatusDict(TypedDict):
    """Status summary of the AI revenue engine"""
    total_customers: int
    mrr: float
    arr: float
    customers_at_risk: int
    churn_predictions: int
    upsell_opportunities: int
    auto_actions_enabled: bool


class RevenueAI:
    """
    AI-Driven Revenue Optimization.

    Features:
    - Churn prediction and prevention
    - Upsell opportunity detection
    - Dynamic pricing optimization
    - Revenue forecasting
    """

    # Tier configuration (exposed for external access)
    TIERS = UpsellDetector.TIERS

    def __init__(self, enable_auto_actions: bool = False):
        self.enable_auto_actions = enable_auto_actions

        # Data stores
        self.customers: Dict[str, CustomerProfile] = {}
        self.predictions: Dict[str, ChurnPrediction] = {}
        self.recommendations: Dict[str, List[UpsellRecommendation]] = {}

        # Components
        self._churn_predictor = ChurnPredictor()
        self._upsell_detector = UpsellDetector()
        self._price_optimizer = PriceOptimizer()
        self._metrics_calculator = MetricsCalculator()

        self._lock = threading.Lock()
        self._metrics_history: List[RevenueMetrics] = []

        logger.info("RevenueAI initialized")

    def add_customer(self, profile: CustomerProfile):
        """Add or update customer profile."""
        with self._lock:
            self.customers[profile.id] = profile
        logger.debug(f"Customer added: {profile.name}")

    def predict_churn(self, customer_id: str) -> Optional[ChurnPrediction]:
        """Predict churn risk for a customer."""
        customer = self.customers.get(customer_id)
        if not customer:
            return None

        prediction = self._churn_predictor.predict(customer)

        with self._lock:
            self.predictions[customer_id] = prediction

        return prediction

    def detect_upsell(self, customer_id: str) -> List[UpsellRecommendation]:
        """Detect upsell opportunities for a customer."""
        customer = self.customers.get(customer_id)
        if not customer:
            return []

        recommendations = self._upsell_detector.detect(customer)

        with self._lock:
            self.recommendations[customer_id] = recommendations

        return recommendations

    def optimize_price(
        self,
        product_id: str,
        current_price: float,
        demand_data: Optional[Dict[str, float]] = None,
    ) -> PricingRecommendation:
        """Optimize pricing using demand data."""
        return self._price_optimizer.optimize(product_id, current_price, demand_data)

    def calculate_metrics(self) -> RevenueMetrics:
        """Calculate current revenue metrics."""
        metrics = self._metrics_calculator.calculate(self.customers, self.predictions)

        with self._lock:
            self._metrics_history.append(metrics)
            # Keep last 30 days
            if len(self._metrics_history) > 30 * 24:
                self._metrics_history = self._metrics_history[-30 * 24 :]

        return metrics

    def get_status(self) -> RevenueAIStatusDict:
        """Get RevenueAI status."""
        metrics = self.calculate_metrics()

        return {
            "total_customers": len(self.customers),
            "mrr": metrics.mrr,
            "arr": metrics.arr,
            "customers_at_risk": metrics.customers_at_risk,
            "churn_predictions": len(self.predictions),
            "upsell_opportunities": sum(len(r) for r in self.recommendations.values()),
            "auto_actions_enabled": self.enable_auto_actions,
        }
