"""
Handlers for the Quota MCP Server.
Wraps the restored QuotaEngine logic.
"""
import logging
from typing import Any, Dict

from .engine import QuotaEngine

# Setup logging
logger = logging.getLogger(__name__)

class QuotaHandler:
    """
    Quota Engine Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.engine = QuotaEngine()

    def get_status(self) -> Dict[str, Any]:
        """
        Get current comprehensive quota status.
        """
        logger.info("Fetching quota status...")
        return self.engine.get_current_status()

    def get_cli_report(self, format_type: str = "full") -> str:
        """
        Get formatted CLI report.
        """
        logger.info(f"Generating CLI report (format: {format_type})...")
        return self.engine.format_cli_output(format_type=format_type)

    def get_optimal_model(self, task_type: str = "general") -> str:
        """
        Recommends the best model to use based on remaining quota.
        Favors Gemini models for speed and cost efficiency.
        """
        logger.info(f"Calculating optimal model for task: {task_type}...")
        status = self.engine.get_current_status()
        models = status.get("models", [])

        # Simple logic: Find Gemini models with most quota
        gemini_models = [m for m in models if "gemini" in m.get("name", "").lower()]
        if gemini_models:
            # Sort by remaining percent descending
            best = sorted(gemini_models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[0]
            return best.get("id", "gemini-3-flash") # Return ID, not name

        # Fallback to any model with most quota
        if models:
            best = sorted(models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[0]
            return best.get("id", "gemini-3-flash")

        return "gemini-3-flash" # Default fallback
