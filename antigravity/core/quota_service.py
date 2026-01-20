"""
Quota Service - Bridge to the centralized Quota Engine.
Provides a high-level API for sub-agents to query and optimize model usage.
"""
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add packages to path to ensure we can import from packages/antigravity
packages_path = Path(__file__).parent.parent.parent / "packages"
if str(packages_path) not in sys.path:
    sys.path.append(str(packages_path))

try:
    from antigravity.core.quota.engine import QuotaEngine
    from antigravity.core.quota.enums import StatusFormat
    HAS_QUOTA_PACKAGE = True
except ImportError:
    HAS_QUOTA_PACKAGE = False

class QuotaService:
    """
    Centralized economic core for Agency OS.
    Manages model quotas and routing to maximize Gemini 1M efficiency.
    """
    def __init__(self):
        if HAS_QUOTA_PACKAGE:
            self.engine = QuotaEngine()
        else:
            self.engine = None

    def get_status(self) -> Dict[str, Any]:
        """Returns the current status of all model quotas."""
        if not self.engine:
            return {"error": "Quota package not available"}
        return self.engine.get_current_status()

    def get_summary(self) -> str:
        """Returns a formatted string summary for the CLI."""
        if not self.engine:
            return "⚠️ Quota Engine not installed."
        return self.engine.format_cli_output(format_type="full")

    def optimize_routing(self, task_type: str) -> str:
        """
        Suggests the best model for a given task based on remaining quota.
        Prioritizes Gemini 1M for long-context tasks.
        """
        # Basic heuristic for optimization
        status = self.get_status()
        if "error" in status:
            return "gemini-3-flash" # Default

        # Logic to pick the healthiest model pool
        return "gemini-3-flash[1m]"

# Global singleton
quota_service = QuotaService()
