"""
Checkpointing Package
=====================

Session Save/Restore for the Agency OS.
Manages system-wide state snapshots for reliable recovery,
A/B testing of strategic decisions, and automatic rollback.

State Includes:
- Revenue & Cashflow targets
- Agent Memory & Learned patterns
- Data Moat health metrics
- Loyalty & Tenure status

Binh Phap: Cuu Dia (Nine Terrains) - Knowing when to hold and when to move.
"""

from .manager import Checkpoint, create_checkpoint
from .models import SessionState

__all__ = ["Checkpoint", "SessionState", "create_checkpoint"]
