import logging
from datetime import datetime
from typing import Optional

from backend.services.llm.types import TokenUsage

logger = logging.getLogger(__name__)


class LLMUsageTracker:
    """
    Tracks token usage for LLM requests.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMUsageTracker, cls).__new__(cls)
        return cls._instance

    async def track_usage(
        self, provider: str, model: str, usage: Optional[TokenUsage], request_type: str = "text"
    ):
        """
        Log token usage. In a real implementation, this would write to a DB table
        (e.g., llm_usage) to track costs per tenant/user.
        """
        if not usage:
            return

        # For now, we log to stdout/file.
        # Future: Insert into database table 'llm_usage'
        logger.info(
            f"LLM Usage | Provider: {provider} | Model: {model} | "
            f"Type: {request_type} | "
            f"Prompt: {usage.get('prompt_tokens', 0)} | "
            f"Completion: {usage.get('completion_tokens', 0)} | "
            f"Total: {usage.get('total_tokens', 0)}"
        )


# Global instance
llm_usage_tracker = LLMUsageTracker()
