"""
🏯 Agent Crews - Multi-Agent Teams
==================================

Crews are high-performance teams of specialized AI agents working in
orchestration. Each crew features a lead, multiple workers, and a dedicated
QA reviewer to ensure output quality and consistency.

Structure:
- Lead: Context builder and strategy planner.
- Workers: Domain-specific executioners.
- QA: Rule-set enforcer and quality gatekeeper.

Binh Pháp: 🤝 Quân Tranh (Speed & Unity) - Efficient coordination.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agent_crews package.
"""

from antigravity.core.agent_crews import (
    CREWS,
    Crew,
    CrewMember,
    CrewResult,
    CrewStatus,
    get_crew,
    get_crew_summary,
    list_crews,
    print_crew_matrix,
    run_crew,
)

__all__ = [
    "CrewStatus",
    "CrewMember",
    "Crew",
    "CrewResult",
    "CREWS",
    "get_crew",
    "list_crews",
    "get_crew_summary",
    "run_crew",
    "print_crew_matrix",
]
