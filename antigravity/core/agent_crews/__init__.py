"""
🏯 Agent Crews Module
=====================

Crews are high-performance teams of specialized AI agents working in
orchestration.
"""

from .engine import (
    get_crew,
    get_crew_summary,
    list_crews,
    print_crew_matrix,
    run_crew,
)
from .models import Crew, CrewMember, CrewResult, CrewStatus
from .registry import CREWS

__all__ = [
    "Crew",
    "CrewMember",
    "CrewResult",
    "CrewStatus",
    "CREWS",
    "get_crew",
    "list_crews",
    "get_crew_summary",
    "run_crew",
    "print_crew_matrix",
]
