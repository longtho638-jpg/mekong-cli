"""
ML Scoring - Performance and Viral Scoring Functions
=====================================================

Contains scoring utilities for:
- Viral multiplier calculation
- Performance score computation
"""

import time
from typing import Any, Dict


def calculate_viral_multiplier(features: Dict[str, Any]) -> float:
    """
    Calculate advanced viral multiplier.

    Args:
        features: Feature dictionary with viral factors

    Returns:
        Viral multiplier value
    """
    base_viral = features.get("viral_coefficient", 1.0)

    # Advanced viral factors
    social_share_factor = 1 + features.get("social_shares", 0) * 0.01
    referral_potential = 1 + features.get("referral_rate", 0) * 0.05
    content_virality = features.get("content_virality", 1.0)

    # Time-based viral amplification
    current_hour = time.localtime().tm_hour
    time_multiplier = 1.0
    if 18 <= current_hour <= 22:  # Prime viral hours
        time_multiplier = 1.5
    elif 6 <= current_hour <= 9:  # Morning viral hours
        time_multiplier = 1.2

    return (
        base_viral
        * social_share_factor
        * referral_potential
        * content_virality
        * time_multiplier
    )


def calculate_performance_score(game_changing_metrics: dict) -> float:
    """
    Calculate overall performance score.

    Args:
        game_changing_metrics: Dictionary of performance metrics

    Returns:
        Performance score (0-100)
    """
    base_score = 50.0

    viral_score = min(game_changing_metrics["viral_multiplier_achieved"] * 10, 100)
    quantum_score = min(game_changing_metrics["quantum_optimizations"] * 2, 100)
    ai_score = min(game_changing_metrics["ai_agent_decisions"] * 1, 100)

    confidence_bonus = min(game_changing_metrics["confidence_improvements"] * 100, 50)

    return (
        min(base_score + viral_score + quantum_score + ai_score + confidence_bonus, 1000.0)
        / 10.0
    )
