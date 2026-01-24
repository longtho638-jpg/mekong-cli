"""
Checkpoint Serializer - Logic for gathering and applying system state.
"""
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from typing_extensions import TypedDict

logger = logging.getLogger(__name__)


class StateMetadataDict(TypedDict):
    created_at: str
    os: str


class SystemStateDict(TypedDict, total=False):
    """Full system state checkpoint"""
    metadata: StateMetadataDict
    moat: Dict[str, Any]
    cashflow: Dict[str, Any]
    memory: Dict[str, Any]


class CheckpointSerializer:
    """Handles serialization and deserialization of system state."""

    def gather_system_state(self) -> SystemStateDict:
        """Orchestrates data gathering from all Agency OS modules."""
        state: SystemStateDict = {
            "metadata": {"created_at": datetime.now().isoformat(), "os": os.name}
        }

        # 1. Moat Engine State
        try:
            from ..moat_engine import moat_engine
            state["moat"] = moat_engine.get_stats()
        except ImportError:
            pass

        # 2. Cashflow State
        try:
            from ..cashflow_engine import get_cashflow_engine
            cf = get_cashflow_engine()
            state["cashflow"] = {"arr": cf.get_total_arr(), "progress": cf.get_progress_percent()}
        except Exception:
            pass

        # 3. Memory State
        try:
            from ..agent_memory import get_agent_memory
            mem = get_agent_memory()
            state["memory"] = mem.get_stats()
        except Exception:
            pass

        return state

    def apply_state(self, data: SystemStateDict):
        """Logic to inject restored data back into running engines."""
        logger.debug(f"Restoring {len(data)} system domains...")
        # In production, this would dispatch state to various engines
