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
"""

import logging
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class CrewStatus(Enum):
    """Lifecycle stages of a crew execution mission."""
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class CrewMember:
    """A single agent participating in a crew."""
    agent: str
    role: str  # lead, worker, qa
    skills: List[str] = field(default_factory=list)


@dataclass
class Crew:
    """Definition of a specialized multi-agent squad."""
    name: str
    description: str
    lead: CrewMember
    workers: List[CrewMember]
    qa: CrewMember
    skills_required: List[str] = field(default_factory=list)


@dataclass
class CrewResult:
    """Comprehensive output and metadata from a crew mission."""
    crew_name: str
    status: CrewStatus
    steps_completed: int
    total_steps: int
    output: Optional[str] = None
    execution_time: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


# Crew Definitions (The Agency Workforce)
CREWS: Dict[str, Crew] = {
    # 🚀 Product Launch Crew - Full-stack delivery
    "product_launch": Crew(
        name="Product Launch Crew",
        description="End-to-end delivery from conceptualization to production.",
        lead=CrewMember("project-manager", "lead", ["planning", "problem-solving"]),
        workers=[
            CrewMember("planner", "worker", ["planning"]),
            CrewMember("fullstack-developer", "worker", ["frontend-development", "backend-development"]),
            CrewMember("ui-ux-designer", "worker", ["ui-ux-pro-max", "ui-styling"]),
            CrewMember("tester", "worker", ["vibe-testing"]),
            CrewMember("docs-manager", "worker", ["document-skills"]),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["planning", "frontend-development", "backend-development"],
    ),
    
    # 💰 Revenue Accelerator Crew - Business growth
    "revenue_accelerator": Crew(
        name="Revenue Accelerator Crew",
        description="Drives growth through client acquisition and pricing optimization.",
        lead=CrewMember("money-maker", "lead", ["payment-integration"]),
        workers=[
            CrewMember("client-magnet", "worker", []),
            CrewMember("deal-closer", "worker", ["binh-phap-wisdom"]),
            CrewMember("copywriter", "worker", []),
            CrewMember("growth-strategist", "worker", ["research"]),
        ],
        qa=CrewMember("client-value", "qa", []),
        skills_required=["binh-phap-wisdom", "payment-integration"],
    ),
    
    # 🎨 Content Machine Crew - Media production
    "content_machine": Crew(
        name="Content Machine Crew",
        description="Scalable production of high-engagement, localized content.",
        lead=CrewMember("content-factory", "lead", []),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("copywriter", "worker", []),
            CrewMember("ui-ux-designer", "worker", ["ui-ux-pro-max"]),
            CrewMember("brainstormer", "worker", ["brainstorming"]),
        ],
        qa=CrewMember("growth-strategist", "qa", []),
        skills_required=["research", "brainstorming"],
    ),
    
    # 🛠️ Dev Ops Crew - Infrastructure & CI/CD
    "dev_ops": Crew(
        name="DevOps Crew",
        description="Ensures system stability, automated testing, and secure deployment.",
        lead=CrewMember("fullstack-developer", "lead", ["frontend-development", "backend-development"]),
        workers=[
            CrewMember("planner", "worker", ["planning"]),
            CrewMember("database-admin", "worker", ["databases"]),
            CrewMember("tester", "worker", ["vibe-testing", "debugging"]),
            CrewMember("git-manager", "worker", []),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["frontend-development", "backend-development", "databases"],
    ),
    
    # 🏯 Strategy Crew - Strategic Binh Pháp analysis
    "strategy": Crew(
        name="Strategy Crew",
        description="Deep analysis using Binh Pháp framework for market winning.",
        lead=CrewMember("binh-phap-strategist", "lead", ["binh-phap-wisdom"]),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("growth-strategist", "worker", []),
            CrewMember("planner", "worker", ["planning"]),
        ],
        qa=CrewMember("money-maker", "qa", []),
        skills_required=["binh-phap-wisdom", "research", "planning"],
    ),
    
    # 🐛 Debug Squad Crew - High-efficiency bug fixing
    "debug_squad": Crew(
        name="Debug Squad Crew",
        description="Rapid diagnostic and resolution of complex technical issues.",
        lead=CrewMember("debugger", "lead", ["debugging"]),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("fullstack-developer", "worker", []),
            CrewMember("tester", "worker", ["vibe-testing"]),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["debugging", "code-review"],
    ),
}


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


def run_crew(name: str, context: Optional[Dict[str, Any]] = None) -> CrewResult:
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
            error=f"Crew '{name}' is not in the Agency OS roster."
        )
    
    started_at = datetime.now()
    start_time = time.time()
    
    # Total steps = Planning (1) + Workers (N) + QA (1)
    total_steps = 1 + len(crew.workers) + 1
    
    logger.info(f"Activating crew: {crew.name}")
    
    # Phase 1: Context & Planning
    logger.info(f"PHASE 1: {crew.lead.agent} is preparing the context...")
    time.sleep(0.1) # Simulating prep
    
    # Phase 2: Parallel/Sequential Execution
    for i, worker in enumerate(crew.workers, 1):
        logger.info(f"PHASE 2.{i}: {worker.agent} executing assigned task...")
        time.sleep(0.05) # Simulating work
    
    # Phase 3: Review & Gatekeeping
    logger.info(f"PHASE 3: {crew.qa.agent} performing final quality check...")
    time.sleep(0.1) # Simulating review
    
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
        print(f"Roster  : {crew.lead.agent} (L) + {len(crew.workers)} Workers + {crew.qa.agent} (QA)")
        print("-" * 70)
    print()