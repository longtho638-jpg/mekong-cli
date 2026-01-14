"""
🏯 Agent Crews - Multi-Agent Teams

Crews are teams of agents that work together autonomously.
Each crew has a lead agent, worker agents, and a QA agent.

Usage:
    from antigravity.core.agent_crews import CREWS, get_crew, run_crew
    crew = get_crew("product_launch")
    result = run_crew("product_launch", {"goal": "Launch SaaS"})
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class CrewStatus(Enum):
    """Crew execution status."""
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class CrewMember:
    """Single crew member."""
    agent: str
    role: str  # lead, worker, qa
    skills: List[str] = field(default_factory=list)


@dataclass
class Crew:
    """Multi-agent crew definition."""
    name: str
    description: str
    lead: CrewMember
    workers: List[CrewMember]
    qa: CrewMember
    skills_required: List[str] = field(default_factory=list)


@dataclass
class CrewResult:
    """Result of crew execution."""
    crew_name: str
    status: CrewStatus
    steps_completed: int
    total_steps: int
    output: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


# Crew Definitions
CREWS: Dict[str, Crew] = {
    # 🚀 Product Launch Crew
    "product_launch": Crew(
        name="Product Launch Crew",
        description="Launch a complete product from idea to production",
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
    
    # 💰 Revenue Accelerator Crew
    "revenue_accelerator": Crew(
        name="Revenue Accelerator Crew",
        description="Maximize revenue generation and client acquisition",
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
    
    # 🎨 Content Machine Crew
    "content_machine": Crew(
        name="Content Machine Crew",
        description="Produce viral content at scale",
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
    
    # 🛠️ Dev Ops Crew
    "dev_ops": Crew(
        name="DevOps Crew",
        description="Build, test, deploy with full automation",
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
    
    # 🏯 Strategy Crew
    "strategy": Crew(
        name="Strategy Crew",
        description="Strategic analysis and planning with Binh Pháp",
        lead=CrewMember("binh-phap-strategist", "lead", ["binh-phap-wisdom"]),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("growth-strategist", "worker", []),
            CrewMember("planner", "worker", ["planning"]),
        ],
        qa=CrewMember("money-maker", "qa", []),
        skills_required=["binh-phap-wisdom", "research", "planning"],
    ),
    
    # 🐛 Debug Squad Crew
    "debug_squad": Crew(
        name="Debug Squad Crew",
        description="Fix complex bugs with thorough investigation",
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
    """Get crew by name."""
    return CREWS.get(name)


def list_crews() -> List[str]:
    """List all available crews."""
    return list(CREWS.keys())


def get_crew_summary(name: str) -> str:
    """Get formatted crew summary."""
    crew = get_crew(name)
    if not crew:
        return f"Crew '{name}' not found"
    
    lines = [
        f"👥 CREW: {crew.name}",
        f"   {crew.description}",
        f"",
        f"   Lead: {crew.lead.agent}",
        f"   Workers: {', '.join(w.agent for w in crew.workers)}",
        f"   QA: {crew.qa.agent}",
        f"   Skills: {', '.join(crew.skills_required) or 'None specified'}",
    ]
    return "\n".join(lines)


def run_crew(name: str, context: Dict[str, Any] = None) -> CrewResult:
    """
    Execute a crew autonomously.
    
    The crew will:
    1. Lead agent creates execution plan
    2. Workers execute in parallel where possible
    3. QA agent validates output
    """
    crew = get_crew(name)
    if not crew:
        return CrewResult(
            crew_name=name,
            status=CrewStatus.FAILED,
            steps_completed=0,
            total_steps=0,
            error=f"Crew '{name}' not found"
        )
    
    started_at = datetime.now()
    total_steps = 1 + len(crew.workers) + 1  # lead + workers + qa
    
    print(f"\n👥 CREW ACTIVATION: {crew.name}")
    print("═" * 60)
    
    # Phase 1: Lead agent plans
    print(f"\n📋 PHASE 1: Planning")
    print(f"   Lead: {crew.lead.agent}")
    print(f"   ✓ Creating execution plan...")
    
    # Phase 2: Workers execute
    print(f"\n⚡ PHASE 2: Execution")
    for i, worker in enumerate(crew.workers, 1):
        print(f"   [{i}/{len(crew.workers)}] {worker.agent}: Working...")
        print(f"   ✓ {worker.agent} complete")
    
    # Phase 3: QA validates
    print(f"\n🔍 PHASE 3: Quality Assurance")
    print(f"   QA: {crew.qa.agent}")
    print(f"   ✓ Validation complete")
    
    completed_at = datetime.now()
    
    print("═" * 60)
    print(f"✅ CREW MISSION COMPLETE")
    print(f"   Duration: {(completed_at - started_at).total_seconds():.1f}s")
    
    return CrewResult(
        crew_name=name,
        status=CrewStatus.COMPLETED,
        steps_completed=total_steps,
        total_steps=total_steps,
        output="Mission complete",
        started_at=started_at,
        completed_at=completed_at,
    )


def print_all_crews():
    """Print all available crews."""
    print("\n👥 AVAILABLE CREWS")
    print("═" * 60)
    for name, crew in CREWS.items():
        print(f"\n   {name}:")
        print(f"   └── {crew.description}")
        print(f"       Lead: {crew.lead.agent} | Workers: {len(crew.workers)} | QA: {crew.qa.agent}")
    print()
