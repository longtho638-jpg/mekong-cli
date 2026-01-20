"""
Quota Service - Bridge to Antigravity Quota Engine
=================================================

Provides a unified interface for agents to check model quotas and optimize 
token usage based on the current economic status.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from antigravity.mcp_servers.quota_server.engine import QuotaEngine

logger = logging.getLogger(__name__)

class QuotaService:
    """
    Service wrapper for QuotaEngine to be used within the AgencyOS context.
    """
    def __init__(self):
        self.engine = QuotaEngine()
    
    def get_status(self) -> Dict[str, Any]:
        """Returns the current quota status across all pools."""
        return self.engine.get_current_status()
    
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
