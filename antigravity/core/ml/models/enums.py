"""
ML Models - Enums.
==================

Pricing mode and feature category enumerations.
"""

from enum import Enum


class PricingMode(Enum):
    """Advanced pricing modes."""

    QUANTUM_INSPIRED = "quantum"
    AI_AGENT = "ai_agent"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"
    REINFORCEMENT_LEARNING = "reinforcement_learning"


class GameChangingFeature(Enum):
    """Game-changing feature categories."""

    VIRAL_EXPANSION = "viral_expansion"
    QUANTUM_PRICING = "quantum_pricing"
    AI_AGENTS = "ai_agents"
    BLOCKCHAIN_INTEGRATION = "blockchain_integration"
