"""
Handlers for the Quota MCP Server.
Wraps the restored QuotaEngine logic with Account Fallback.
"""

import logging
from typing import Any, Dict, Optional

from .account_selector import get_account_selector
from .engine import QuotaEngine

# Setup logging
logger = logging.getLogger(__name__)


class QuotaHandler:
    """
    Quota Engine Logic
    Adapted for MCP usage with Account Fallback support.
    """

    def __init__(self):
        self.engine = QuotaEngine()
        self._account_selector = get_account_selector()

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
            best = sorted(gemini_models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[
                0
            ]
            return best.get("id", "gemini-3-pro-high")  # Return ID, not name

        # Fallback to any model with most quota
        if models:
            best = sorted(models, key=lambda x: x.get("remaining_percent", 0), reverse=True)[0]
            return best.get("id", "gemini-3-pro-high")

        return "gemini-3-pro-high"  # Default fallback

    def get_account_for_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the best account for a specific model with fallback support.

        When one account is exhausted, automatically falls back to another.

        Args:
            model_id: Model ID to get account for

        Returns:
            Account info dict with email and quota, or None if all exhausted
        """
        account = self._account_selector.get_best_account(model_id)

        if account:
            return {
                "email": account.email,
                "remaining_percent": account.model_quotas.get(model_id, 0.0),
                "is_fallback": False,
            }

        return None

    def handle_quota_exhausted(self, current_email: str, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Handle quota exhausted error by finding fallback account.

        Call this when API returns 500/429 quota error.

        Args:
            current_email: The exhausted account email
            model_id: Model that needs quota

        Returns:
            Fallback account info, or None if no fallback available
        """
        logger.warning(f"Quota exhausted for {current_email}/{model_id}, finding fallback...")

        fallback = self._account_selector.get_fallback_account(current_email, model_id)

        if fallback:
            return {
                "email": fallback.email,
                "remaining_percent": fallback.model_quotas.get(model_id, 0.0),
                "is_fallback": True,
            }

        logger.error(f"No fallback available for {model_id}!")
        return None
