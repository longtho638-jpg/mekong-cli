"""
🏯 Agent Crews Engine
====================

Logic for managing and executing multi-agent crews.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from .models import Crew, CrewResult, CrewStatus
from .registry import CREWS

# Configure logging
logger = logging.getLogger(__name__)


class CrewContextDict(TypedDict, total=False):
    """Context data for crew execution"""
    mission_id: str
    tenant_id: str
    target: str
    parameters: Dict[str, Any]


def get_crew(name: str) -> Optional[Crew]:
    """Retrieves a crew definition by its ID."""
    return CREWS.get(name)


def list_crews() -> List[str]:
    """Returns a list of all registered crew IDs."""
    return list(CREWS.keys())


def get_crew_summary(name: str) -> str:
    """Generates a high-level overview of a crew's roster and mission."""
    crew = get_crew(name)
    if not crew:
        return f"⚠️ Crew '{name}' not found."

    lines = [
        f"👥 CREW: {crew.name}",
        f"   {crew.description}",
        "",
        f"   Lead    : ⭐ {crew.lead.agent}",
        f"   Workers : {', '.join(w.agent for w in crew.workers)}",
        f"   QA      : 🔍 {crew.qa.agent}",
        f"   Skills  : {', '.join(crew.skills_required) or 'Dynamic'}",
    ]
    return "\n".join(lines)


def run_crew(name: str, context: Optional[CrewContextDict] = None) -> CrewResult:
    """
    Simulates or executes a full crew mission.
    In production, this triggers the agent orchestration protocol.
    """
    crew = get_crew(name)
    if not crew:
        return CrewResult(
            crew_name=name,
            status=CrewStatus.FAILED,
            steps_completed=0,
            total_steps=0,
            error=f"Crew '{name}' is not in the Agency OS roster.",
        )

    started_at = datetime.now()
    start_time = time.time()

    # Total steps = Planning (1) + Workers (N) + QA (1)
    total_steps = 1 + len(crew.workers) + 1

    logger.info(f"Activating crew: {crew.name}")

    # Phase 1: Context & Planning
    logger.info(f"PHASE 1: {crew.lead.agent} is preparing the context...")
    time.sleep(0.1)  # Simulating prep

    # Phase 2: Parallel/Sequential Execution
    for i, worker in enumerate(crew.workers, 1):
        logger.info(f"PHASE 2.{i}: {worker.agent} executing assigned task...")
        time.sleep(0.05)  # Simulating work

    # Phase 3: Review & Gatekeeping
    logger.info(f"PHASE 3: {crew.qa.agent} performing final quality check...")
    time.sleep(0.1)  # Simulating review

    execution_time = time.time() - start_time
    completed_at = datetime.now()

    return CrewResult(
        crew_name=name,
        status=CrewStatus.COMPLETED,
        steps_completed=total_steps,
        total_steps=total_steps,
        output=f"Successfully completed mission: {crew.name}",
        execution_time=execution_time,
        started_at=started_at,
        completed_at=completed_at,
    )


def print_crew_matrix():
    """Renders a beautiful ASCII table of all available crews."""
    print("\n👥 AGENCY OS - CREW ROSTER")
    print("═" * 70)
    for name, crew in CREWS.items():
        print(f"[{name.upper():^20}]")
        print(f"Mission : {crew.description}")
        print(
            f"Roster  : {crew.lead.agent} (L) + {len(crew.workers)} Workers + {crew.qa.agent} (QA)"
        )
        print("-" * 70)
    print()
