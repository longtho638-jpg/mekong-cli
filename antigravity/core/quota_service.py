"""
Quota Service - Bridge to Antigravity Quota Engine
=================================================

Provides a unified interface for agents to check model quotas and optimize 
token usage based on the current economic status.
"""

import logging
from antigravity.mcp_servers.quota_server.engine import QuotaEngine
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

logger = logging.getLogger(__name__)


class ModelQuotaDict(TypedDict):
    """Specific model quota data"""
    id: str
    name: str
    remaining_percent: float
    threshold_level: str
    countdown: str
    reset_time: str
    status_emoji: str
    status_full: str
    pool_id: Optional[str]
    capabilities: List[str]
    context_window: Optional[int]


class QuotaPoolDict(TypedDict):
    """Quota pool data"""
    id: str
    name: str
    aggregate_remaining: float
    model_count: int
    lowest_model: Optional[str]


class QuotaStatusResponse(TypedDict):
    """Full quota status response"""
    models: List[ModelQuotaDict]
    pools: Dict[str, QuotaPoolDict]
    ungrouped: List[ModelQuotaDict]
    alerts: Dict[str, List[str]]
    status_bar: str
    last_fetch: Optional[str]


class QuotaService:
    """
    Service wrapper for QuotaEngine to be used within the AgencyOS context.
    """
    def __init__(self):
        self.engine = QuotaEngine()

    def get_status(self) -> QuotaStatusResponse:
        """Returns the current quota status across all pools."""
        return self.engine.get_current_status()  # type: ignore

    def get_cli_report(self) -> str:
        """Returns a formatted CLI report of the quota status."""
        return self.engine.format_cli_output(format_type="full")
    
    def get_optimal_model(self, task_type: str = "general") -> str:
        """
        Recommends the best model to use based on remaining quota.
        Favors Gemini 1M models for speed and cost efficiency.
        """
        status = self.get_status()
        models = status.get("models", [])
        
        # Simple logic: Find Gemini models with most quota
        gemini_models = [m for m in models if "name" in m and "gemini" in m["name"].lower()]
        if gemini_models:
            # Sort by remaining percent descending
            best = sorted(gemini_models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[0]
            return best["name"]
        
        # Fallback to any model with most quota
        if models:
            best = sorted(models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[0]
            return best["name"]
            
        return "gemini-3-flash" # Default

# Global singleton
quota_service = QuotaService()
