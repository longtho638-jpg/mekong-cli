"""
IPOps Agents Package
Patent + Trademark
"""

from .patent_agent import Patent, PatentAgent, PatentStatus, PatentType
from .trademark_agent import Trademark, TrademarkAgent, TrademarkClass, TrademarkStatus

__all__ = [
    # Patent
    "PatentAgent",
    "Patent",
    "PatentStatus",
    "PatentType",
    # Trademark
    "TrademarkAgent",
    "Trademark",
    "TrademarkStatus",
    "TrademarkClass",
]
