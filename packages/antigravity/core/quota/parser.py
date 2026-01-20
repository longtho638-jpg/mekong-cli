from datetime import datetime
from typing import Any, Dict, List, Optional

from .models import QuotaModel


class QuotaParser:
    """Parses raw quota data into QuotaModel objects."""

    @staticmethod
    def parse_quota_data(data: Dict[str, Any]) -> List[QuotaModel]:
        """Parse raw quota data from Antigravity API into QuotaModel objects."""
        models = []

        # Handle Antigravity API response format
        # Structure: userStatus.cascadeModelConfigData.clientModelConfigs
        user_status = data.get("userStatus", {})
        cascade_data = user_status.get("cascadeModelConfigData", {})
        client_configs = cascade_data.get("clientModelConfigs", [])

        # Fallback to old format for compatibility
        if not client_configs:
            client_configs = data.get("models", [])

        for item in client_configs:
            reset_time = None

            # New Antigravity API format
            quota_info = item.get("quotaInfo", {})
            reset_time_str = quota_info.get("resetTime")

            if reset_time_str:
                try:
                    # Handle ISO format with Z suffix
                    if reset_time_str.endswith("Z"):
                        reset_time_str = reset_time_str[:-1] + "+00:00"
                    reset_time = datetime.fromisoformat(reset_time_str)
                except ValueError:
                    pass
            elif item.get("resetAt"):
                # Old format fallback
                reset_time = datetime.fromisoformat(item["resetAt"])

            # Calculate remaining percent
            remaining_fraction = quota_info.get("remainingFraction", 1.0)
            remaining_percent = float(remaining_fraction) * 100.0

            # Or use old format
            if "remaining" in item:
                remaining_percent = float(item.get("remaining", 0))

            # Build capabilities list from supportsX fields
            capabilities = []
            if item.get("supportsImages"):
                capabilities.append("vision")
            if item.get("supportsVideo"):
                capabilities.append("video")
            if item.get("supportsThinking"):
                capabilities.append("thinking")
            capabilities.append("text")
            capabilities.append("code")

            # Determine model ID and name
            model_id = item.get("modelOrAlias", {}).get("model", item.get("id", "unknown"))
            model_name = item.get("label", item.get("name", "Unknown Model"))

            models.append(
                QuotaModel(
                    model_id=model_id,
                    model_name=model_name,
                    remaining_percent=remaining_percent,
                    reset_time=reset_time,
                    pool_id=item.get("poolId"),
                    capabilities=capabilities,
                    context_window=item.get("maxTokens") or item.get("contextWindow"),
                )
            )
        return models
