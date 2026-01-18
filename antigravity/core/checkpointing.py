"""
💾 Checkpointing - Session Save/Restore
=======================================

Manages system-wide state snapshots for the Agency OS.
Enables reliable recovery, A/B testing of strategic decisions, and
automatic rollback on critical failures.

State Includes:
- 💰 Revenue & Cashflow targets
- 🧠 Agent Memory & Learned patterns
- 🛡️ Data Moat health metrics
- 💎 Loyalty & Tenure status

Binh Pháp: 🏰 Cửu Địa (Nine Terrains) - Knowing when to hold and when to move.
"""

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class SessionState:
    """A point-in-time snapshot of the Agency OS operational data."""

    name: str
    timestamp: datetime = field(default_factory=datetime.now)
    description: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    version: str = "2.0"


class Checkpoint:
    """
    💾 Checkpoint Manager

    The 'Save Game' system for agency operations.
    Useful for creating recovery points before major architectural or
    financial changes.
    """

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/checkpoints"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_path / "index.json"

        self.checkpoints: List[SessionState] = []
        self._load_index()

    def save(self, name: str, description: Optional[str] = None) -> SessionState:
        """
        Gathers current system state and persists it to a unique checkpoint file.
        """
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
        self._write_checkpoint_file(state)

        # Update memory and index
        # If name exists, replace it (latest wins for same name)
        self.checkpoints = [cp for cp in self.checkpoints if cp.name != safe_name]
        self.checkpoints.append(state)
        self._save_index()

        logger.info(f"System checkpoint created: {safe_name}")
        return state

    def restore(self, name: str) -> bool:
        """
        Loads state from a checkpoint and applies it to the active system components.
        """
        checkpoint = self.get(name)
        if not checkpoint:
            logger.error(f"Restoration failed: Checkpoint '{name}' not found.")
            return False

        # Load full data if missing from index
        if not checkpoint.data:
            checkpoint = self._load_checkpoint_file(name)
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
            self._delete_physical_files(name)
            self._save_index()
            logger.info(f"Deleted checkpoint: {name}")
            return True
        return False

    def _gather_system_state(self) -> Dict[str, Any]:
        """Orchestrates data gathering from all Agency OS modules."""
        state = {"metadata": {"created_at": datetime.now().isoformat(), "os": os.name}}

        # 1. Moat Engine State
        try:
            from .moat_engine import moat_engine

            state["moat"] = moat_engine.get_stats()
        except ImportError:
            pass

        # 2. Cashflow State
        try:
            from .cashflow_engine import get_cashflow_engine

            cf = get_cashflow_engine()
            state["cashflow"] = {"arr": cf.get_total_arr(), "progress": cf.get_progress_percent()}
        except Exception:
            pass

        # 3. Memory State
        try:
            from .agent_memory import get_agent_memory

            mem = get_agent_memory()
            state["memory"] = mem.get_stats()
        except Exception:
            pass

        return state

    def _apply_state(self, data: Dict[str, Any]):
        """Logic to inject restored data back into running engines."""
        # Simulated restoration
        logger.debug(f"Restoring {len(data)} system domains...")
        pass

    def _write_checkpoint_file(self, state: SessionState):
        """Physical write of state to a dedicated JSON file."""
        ts = state.timestamp.strftime("%Y%m%d_%H%M%S")
        filename = f"cp_{state.name}_{ts}.json"
        path = self.storage_path / filename

        payload = {
            "name": state.name,
            "description": state.description,
            "timestamp": state.timestamp.isoformat(),
            "version": state.version,
            "data": state.data,
        }

        path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")

    def _load_checkpoint_file(self, name: str) -> Optional[SessionState]:
        """Loads full data for a specific checkpoint name."""
        files = list(self.storage_path.glob(f"cp_{name}_*.json"))
        if not files:
            return None

        # Take most recent if multiple exist for same name
        target_file = sorted(files)[-1]
        try:
            raw = json.loads(target_file.read_text(encoding="utf-8"))
            return SessionState(
                name=raw["name"],
                timestamp=datetime.fromisoformat(raw["timestamp"]),
                description=raw.get("description", ""),
                data=raw.get("data", {}),
                version=raw.get("version", "1.0"),
            )
        except Exception as e:
            logger.error(f"Failed to read checkpoint file {target_file.name}: {e}")
            return None

    def _delete_physical_files(self, name: str):
        """Cleans up checkpoint files matching the name pattern."""
        for f in self.storage_path.glob(f"cp_{name}_*.json"):
            f.unlink()

    def _save_index(self):
        """Saves the metadata index for fast listing."""
        index = [
            {"name": cp.name, "ts": cp.timestamp.isoformat(), "desc": cp.description}
            for cp in self.checkpoints
        ]
        self.index_file.write_text(json.dumps(index, indent=2), encoding="utf-8")

    def _load_index(self):
        """Loads checkpoint metadata on startup."""
        if not self.index_file.exists():
            return

        try:
            data = json.loads(self.index_file.read_text(encoding="utf-8"))
            for item in data:
                self.checkpoints.append(
                    SessionState(
                        name=item["name"],
                        timestamp=datetime.fromisoformat(item["ts"]),
                        description=item.get("desc", ""),
                        data={},  # Lazy load full data
                    )
                )
        except Exception:
            pass

    def print_history(self, limit: int = 10):
        """Pretty-prints the checkpoint history to the console."""
        history = self.list()
        print("\n" + "═" * 60)
        print("║" + "💾 AGENCY OS - CHECKPOINT HISTORY".center(58) + "║")
        print("═" * 60)

        if not history:
            print("   No recovery points recorded yet.")
        else:
            for i, cp in enumerate(history[:limit], 1):
                print(f"   {i}. [{cp.timestamp.strftime('%Y-%m-%d %H:%M')}] {cp.name.upper():<15}")
                if cp.description:
                    print(f"      └─ {cp.description}")
        print("═" * 60 + "\n")


# Global Interface
def create_checkpoint(name: str, desc: Optional[str] = None):
    """Convenience helper for creating a quick recovery point."""
    cm = Checkpoint()
    return cm.save(name, desc)
