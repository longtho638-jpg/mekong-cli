"""
Revenue AI - Churn Predictor.
=============================

Churn prediction and retention action generation.
"""

import logging
import time
from typing import List, Optional

from ..models import (
    ChurnPrediction,
    ChurnRisk,
    CustomerProfile,
)

logger = logging.getLogger(__name__)


class ChurnPredictor:
    """Churn prediction engine."""

    def __init__(self):
        self._model_weights = self._initialize_weights()

    def _initialize_weights(self) -> dict:
        """Initialize churn prediction model weights."""
        return {
            "usage_decline": 0.25,
            "payment_failures": 0.20,
            "support_tickets": 0.15,
            "days_inactive": 0.20,
            "nps_score": 0.10,
            "feature_usage": 0.10,
        }

    def predict(self, customer: CustomerProfile) -> ChurnPrediction:
        """Predict churn risk for a customer."""
        factors = []
        score = 0.0

        # Usage decline factor
        if customer.usage_percent < 30:
            score += self._model_weights["usage_decline"] * 1.0
            factors.append(f"Low usage ({customer.usage_percent:.0f}%)")
        elif customer.usage_percent < 50:
            score += self._model_weights["usage_decline"] * 0.5
            factors.append(f"Moderate usage ({customer.usage_percent:.0f}%)")

        # Payment failures
        if customer.payment_failures > 0:
            failure_score = min(customer.payment_failures * 0.3, 1.0)
            score += self._model_weights["payment_failures"] * failure_score
            factors.append(f"{customer.payment_failures} payment failures")

        # Support tickets (high tickets = frustration)
        if customer.support_tickets > 5:
            score += self._model_weights["support_tickets"] * 0.8
            factors.append(f"High support tickets ({customer.support_tickets})")
        elif customer.support_tickets > 2:
            score += self._model_weights["support_tickets"] * 0.4
            factors.append(f"Moderate support tickets ({customer.support_tickets})")

        # Days inactive
        days_inactive = (time.time() - customer.last_active) / 86400
        if days_inactive > 30:
            score += self._model_weights["days_inactive"] * 1.0
            factors.append(f"Inactive for {days_inactive:.0f} days")
        elif days_inactive > 14:
            score += self._model_weights["days_inactive"] * 0.5
            factors.append(f"Inactive for {days_inactive:.0f} days")

        # NPS score
        if customer.nps_score is not None:
            if customer.nps_score < 6:
                score += self._model_weights["nps_score"] * 1.0
                factors.append(f"Low NPS score ({customer.nps_score})")
            elif customer.nps_score < 8:
                score += self._model_weights["nps_score"] * 0.3

        # Determine risk level
        probability = min(score, 1.0)
        risk = self._calculate_risk_level(probability)

        # Generate recommended actions
        actions = self._generate_retention_actions(customer, risk, factors)

        prediction = ChurnPrediction(
            customer_id=customer.id,
            risk=risk,
            probability=probability,
            factors=factors,
            recommended_actions=actions,
        )

        logger.info(
            f"Churn prediction for {customer.name}: {risk.value} ({probability:.0%})"
        )
        return prediction

    def _calculate_risk_level(self, probability: float) -> ChurnRisk:
        """Calculate risk level from probability."""
        if probability > 0.8:
            return ChurnRisk.CRITICAL
        elif probability > 0.6:
            return ChurnRisk.HIGH
        elif probability > 0.4:
            return ChurnRisk.MEDIUM
        elif probability > 0.2:
            return ChurnRisk.LOW
        else:
            return ChurnRisk.MINIMAL

    def _generate_retention_actions(
        self, customer: CustomerProfile, risk: ChurnRisk, factors: List[str]
    ) -> List[str]:
        """Generate retention actions based on risk factors."""
        actions = []

        if "Low usage" in str(factors):
            actions.append("Schedule onboarding call to increase feature adoption")

        if "payment failures" in str(factors):
            actions.append("Offer payment plan flexibility")

        if "support tickets" in str(factors):
            actions.append("Escalate to customer success for personal attention")

        if "Inactive" in str(factors):
            actions.append("Send re-engagement email with new features")

        if risk in [ChurnRisk.CRITICAL, ChurnRisk.HIGH]:
            actions.append("Offer loyalty discount (10-20%)")
            actions.append("Schedule executive check-in call")

        return actions or ["Monitor customer health metrics"]
