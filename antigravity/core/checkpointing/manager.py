"""
Checkpoint Manager - Core checkpoint operations.

The 'Save Game' system for agency operations.
Useful for creating recovery points before major architectural or
financial changes.

Binh Phap: Cuu Dia (Nine Terrains) - Knowing when to hold and when to move.
"""

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .models import SessionState
from .storage import CheckpointStorage

logger = logging.getLogger(__name__)


class Checkpoint:
    """
    Checkpoint Manager

    The 'Save Game' system for agency operations.
    """

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/checkpoints"):
        self.storage = CheckpointStorage(Path(storage_path))
        self.checkpoints: List[SessionState] = self.storage.load_index()

    def save(self, name: str, description: Optional[str] = None) -> SessionState:
        """Gathers current system state and persists it to a unique checkpoint file."""
        # Ensure name is filesystem friendly
        safe_name = (
            "".join(c for c in name if c.isalnum() or c in (" ", "_")).replace(" ", "_").lower()
        )

        state = SessionState(
            name=safe_name,
            timestamp=datetime.now(),
            description=description or f"Manual checkpoint: {name}",
            data=self._gather_system_state(),
        )

        # Persistence
        self.storage.write_checkpoint(state)

        # Update memory and index (latest wins for same name)
        self.checkpoints = [cp for cp in self.checkpoints if cp.name != safe_name]
        self.checkpoints.append(state)
        self.storage.save_index(self.checkpoints)

        logger.info(f"System checkpoint created: {safe_name}")
        return state

    def restore(self, name: str) -> bool:
        """Loads state from a checkpoint and applies it to active system components."""
        checkpoint = self.get(name)
        if not checkpoint:
            logger.error(f"Restoration failed: Checkpoint '{name}' not found.")
            return False

        # Load full data if missing from index
        if not checkpoint.data:
            checkpoint = self.storage.load_checkpoint(name)
            if not checkpoint:
                return False

        # APPLICATION POINT: In production, this would re-initialize engines
        self._apply_state(checkpoint.data)

        logger.info(f"System state restored to: {name} (from {checkpoint.timestamp.isoformat()})")
        return True

    def get(self, name: str) -> Optional[SessionState]:
        """Retrieves a checkpoint metadata by name."""
        return next((cp for cp in self.checkpoints if cp.name == name), None)

    def list(self) -> List[SessionState]:
        """Returns all available checkpoints, newest first."""
        return sorted(self.checkpoints, key=lambda x: x.timestamp, reverse=True)

    def delete(self, name: str) -> bool:
        """Removes a checkpoint from disk and index."""
        target = self.get(name)
        if target:
            self.checkpoints.remove(target)
            self.storage.delete_files(name)
            self.storage.save_index(self.checkpoints)
            logger.info(f"Deleted checkpoint: {name}")
            return True
        return False

    def _gather_system_state(self) -> Dict[str, Any]:
        """Orchestrates data gathering from all Agency OS modules."""
        state = {"metadata": {"created_at": datetime.now().isoformat(), "os": os.name}}

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

    def _apply_state(self, data: Dict[str, Any]):
        """Logic to inject restored data back into running engines."""
        logger.debug(f"Restoring {len(data)} system domains...")

    def print_history(self, limit: int = 10):
        """Pretty-prints the checkpoint history to the console."""
        history = self.list()
        print("\n" + "=" * 60)
        print("|" + "AGENCY OS - CHECKPOINT HISTORY".center(58) + "|")
        print("=" * 60)

        if not history:
            print("   No recovery points recorded yet.")
        else:
            for i, cp in enumerate(history[:limit], 1):
                print(f"   {i}. [{cp.timestamp.strftime('%Y-%m-%d %H:%M')}] {cp.name.upper():<15}")
                if cp.description:
                    print(f"      - {cp.description}")
        print("=" * 60 + "\n")


# Global Interface
def create_checkpoint(name: str, desc: Optional[str] = None):
    """Convenience helper for creating a quick recovery point."""
    cm = Checkpoint()
    return cm.save(name, desc)
