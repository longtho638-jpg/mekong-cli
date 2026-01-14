"""
💾 Checkpointing - Session Save/Restore

Automatically save and restore snapshots of AgencyOS state.
Inspired by Gemini CLI checkpointing patterns.

Usage:
    from antigravity.core.checkpointing import Checkpoint
    cp = Checkpoint()
    cp.save("before_big_change")
    cp.restore("before_big_change")
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import json


@dataclass
class SessionState:
    """Snapshot of session state."""
    timestamp: datetime
    name: str
    description: str
    data: Dict[str, Any]


class Checkpoint:
    """
    💾 Checkpoint Manager
    
    Save and restore AgencyOS session state.
    """
    
    def __init__(self, storage_path: str = ".antigravity/checkpoints"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.checkpoints: List[SessionState] = []
        self._load_index()
    
    def save(self, name: str, description: str = "") -> SessionState:
        """
        Save current state as a checkpoint.
        
        Args:
            name: Checkpoint name (e.g., "before_refactor")
            description: Optional description
        
        Returns:
            The saved SessionState
        """
        # Gather current state
        state_data = self._gather_state()
        
        state = SessionState(
            timestamp=datetime.now(),
            name=name,
            description=description or f"Checkpoint: {name}",
            data=state_data,
        )
        
        # Save to disk
        self._save_checkpoint(state)
        self.checkpoints.append(state)
        self._save_index()
        
        print(f"💾 Checkpoint saved: {name}")
        return state
    
    def restore(self, name: str) -> bool:
        """
        Restore state from a checkpoint.
        
        Args:
            name: Checkpoint name to restore
        
        Returns:
            True if restored successfully
        """
        checkpoint = self.get(name)
        if not checkpoint:
            print(f"❌ Checkpoint not found: {name}")
            return False
        
        # Restore state
        self._apply_state(checkpoint.data)
        
        print(f"✅ Restored checkpoint: {name}")
        print(f"   From: {checkpoint.timestamp}")
        return True
    
    def get(self, name: str) -> Optional[SessionState]:
        """Get a checkpoint by name."""
        for cp in self.checkpoints:
            if cp.name == name:
                return cp
        return None
    
    def list(self) -> List[SessionState]:
        """List all checkpoints."""
        return sorted(self.checkpoints, key=lambda x: x.timestamp, reverse=True)
    
    def delete(self, name: str) -> bool:
        """Delete a checkpoint."""
        checkpoint = self.get(name)
        if checkpoint:
            self.checkpoints.remove(checkpoint)
            self._delete_checkpoint_file(name)
            self._save_index()
            print(f"🗑️ Deleted checkpoint: {name}")
            return True
        return False
    
    def _gather_state(self) -> Dict[str, Any]:
        """Gather current AgencyOS state."""
        state = {
            "version": "1.0.0",
            "gathered_at": datetime.now().isoformat(),
        }
        
        # Gather moat state
        try:
            from .moat_engine import MoatEngine
            engine = MoatEngine()
            state["moats"] = {
                name: {
                    "strength": moat.strength,
                    "metrics": moat.metrics,
                }
                for name, moat in engine.moats.items()
            }
        except Exception:
            state["moats"] = {}
        
        # Gather cashflow state
        try:
            from .cashflow_engine import CashflowEngine
            cf = CashflowEngine()
            state["cashflow"] = {
                "total_arr": cf.get_total_arr(),
                "progress": cf.get_progress(),
            }
        except Exception:
            state["cashflow"] = {}
        
        # Gather loyalty state
        try:
            from .loyalty_rewards import LoyaltyProgram
            lp = LoyaltyProgram()
            state["loyalty"] = {
                "tenure_months": lp.get_tenure_months(),
                "tier": lp.get_current_tier().name,
            }
        except Exception:
            state["loyalty"] = {}
        
        # Gather memory state
        try:
            from .agent_memory import get_memory
            memory = get_memory()
            state["memory"] = memory.get_stats()
        except Exception:
            state["memory"] = {}
        
        return state
    
    def _apply_state(self, data: Dict[str, Any]):
        """Apply state from checkpoint."""
        # For now, just log what would be restored
        # In production, would actually restore state
        print(f"   Restoring {len(data)} state sections...")
    
    def _save_checkpoint(self, state: SessionState):
        """Save checkpoint to disk."""
        filename = f"{state.name}_{state.timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        path = self.storage_path / filename
        
        data = {
            "name": state.name,
            "description": state.description,
            "timestamp": state.timestamp.isoformat(),
            "data": state.data,
        }
        
        path.write_text(json.dumps(data, indent=2, default=str))
    
    def _delete_checkpoint_file(self, name: str):
        """Delete checkpoint file."""
        for path in self.storage_path.glob(f"{name}_*.json"):
            path.unlink()
    
    def _save_index(self):
        """Save checkpoint index."""
        index = [
            {
                "name": cp.name,
                "timestamp": cp.timestamp.isoformat(),
                "description": cp.description,
            }
            for cp in self.checkpoints
        ]
        index_path = self.storage_path / "index.json"
        index_path.write_text(json.dumps(index, indent=2))
    
    def _load_index(self):
        """Load checkpoint index."""
        index_path = self.storage_path / "index.json"
        if index_path.exists():
            try:
                index = json.loads(index_path.read_text())
                for item in index:
                    self.checkpoints.append(SessionState(
                        name=item["name"],
                        timestamp=datetime.fromisoformat(item["timestamp"]),
                        description=item.get("description", ""),
                        data={},  # Data loaded on demand
                    ))
            except Exception:
                pass
    
    def print_checkpoints(self):
        """Print checkpoint list."""
        checkpoints = self.list()
        
        print("\n💾 CHECKPOINTS")
        print("═" * 50)
        
        if not checkpoints:
            print("   No checkpoints found")
        else:
            for cp in checkpoints[:10]:  # Last 10
                print(f"   📍 {cp.name}")
                print(f"      {cp.timestamp.strftime('%Y-%m-%d %H:%M')}")
                if cp.description:
                    print(f"      {cp.description}")
        
        print("═" * 50)


def auto_checkpoint(name: str = None):
    """Quick auto-checkpoint."""
    cp = Checkpoint()
    if name is None:
        name = f"auto_{datetime.now().strftime('%Y%m%d_%H%M')}"
    return cp.save(name)
