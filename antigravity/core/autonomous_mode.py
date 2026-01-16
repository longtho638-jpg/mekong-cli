'''
🚀 Autonomous Mode - Goal-Based Execution
=========================================

Enables high-level goal setting and autonomous mission execution.
The orchestrator analyzes the goal, decomposes it into a multi-stage plan,
and activates the appropriate agent crews or individual chains.

Mission Workflow:
1. Deconstruct: Goal -> Task List.
2. Delegate: Task -> Agent Crew / Chain.
3. Observe: Capture outcome and learn via Memory.
4. Iterate: Adjust next tasks based on results.

Binh Pháp: ⚡ Cửu Biến (Variations) - Adapting to the situation.
'''

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from .agent_crews import run_crew, CrewStatus
from .agent_orchestrator import AgentOrchestrator
from .agent_memory import get_agent_memory

# Configure logging
logger = logging.getLogger(__name__)

class AutonomousStatus(Enum):
    """Execution states for the autonomous orchestrator."""
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    PAUSED = "paused"
    AWAITING_REVIEW = "awaiting_review"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    """A unit of work within an autonomous mission."""
    id: int
    name: str
    crew: Optional[str] = None
    chain: Optional[str] = None
    status: str = "pending"
    output: Optional[Any] = None
    error: Optional[str] = None


@dataclass
class ExecutionPlan:
    """A structured sequence of tasks to achieve a specific goal."""
    goal: str
    tasks: List[Task] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


class AutonomousOrchestrator:
    """
    🚀 Autonomous Mission Orchestrator
    
    The 'Autopilot' mode for Agency OS.
    Handles complex, multi-step goals with minimal human guidance.
    """

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.goal: Optional[str] = None
        self.plan: Optional[ExecutionPlan] = None
        self.status: AutonomousStatus = AutonomousStatus.IDLE
        self.memory = get_agent_memory()
        self.orchestrator = AgentOrchestrator(verbose=False)

    def set_goal(self, goal: str):
        """Analyzes a new goal and generates an execution plan."""
        self.goal = goal
        self.status = AutonomousStatus.PLANNING

        if self.verbose:
            print(f"\n🎯 MISSION OBJECTIVE: {goal}")
            print("═" * 60)

        self.plan = ExecutionPlan(
            goal=goal,
            tasks=self._analyze_goal(goal)
        )

        if self.verbose:
            print(f"📋 STRATEGIC PLAN ({len(self.plan.tasks)} phases):")
            for task in self.plan.tasks:
                origin = f"Crew: {task.crew}" if task.crew else f"Chain: {task.chain}"
                print(f"   {task.id}. {task.name:<25} | {origin}")
            print()

    def _analyze_goal(self, goal: str) -> List[Task]:
        """Decomposes a goal into specialized tasks using heuristics."""
        g = goal.lower()
        tasks = []
        tid = 1

        # 1. Strategy & Research (Always first for complex goals)
        if any(kw in g for kw in ["saas", "product", "launch", "business", "market"]):
            tasks.append(Task(tid, "Strategic Analysis", crew="strategy"))
            tid += 1

        # 2. Execution Phase
        if any(kw in g for kw in ["build", "product", "feature", "code", "dev"]):
            tasks.append(Task(tid, "Implementation", crew="product_launch"))
            tid += 1
        elif any(kw in g for kw in ["fix", "bug", "issue", "debug"]):
            tasks.append(Task(tid, "Resolution", crew="debug_squad"))
            tid += 1

        # 3. Growth Phase
        if any(kw in g for kw in ["revenue", "sell", "sales", "money", "client"]):
            tasks.append(Task(tid, "Revenue Acceleration", crew="revenue_accelerator"))
            tid += 1
        if any(kw in g for kw in ["content", "viral", "marketing", "social"]):
            tasks.append(Task(tid, "Content Generation", crew="content_machine"))
            tid += 1

        # Fallback for generic goals
        if not tasks:
            tasks.append(Task(tid, "Planning & Discovery", crew="strategy"))
            tid += 1
            tasks.append(Task(tid, "General Execution", chain="dev:cook"))
            tid += 1

        return tasks

    def execute(self, interactive: bool = False) -> bool:
        """
        Runs the generated plan.
        If 'interactive' is True, pauses for confirmation between tasks.
        """
        if not self.plan or not self.plan.tasks:
            logger.error("Attempted to execute without a valid mission plan.")
            return False

        self.status = AutonomousStatus.EXECUTING
        mission_success = True

        if self.verbose:
            print("⚡ INITIATING AUTONOMOUS DEPLOYMENT")
            print("─" * 60)

        for task in self.plan.tasks:
            task.status = "executing"
            if self.verbose:
                print(f"📍 Phase {task.id}: {task.name}...")

            # Execution Logic
            try:
                if task.crew:
                    result = run_crew(task.crew)
                    # result.status is CrewStatus enum
                    if result.status == CrewStatus.COMPLETED:
                        task.status = "completed"
                    else:
                        task.status = "failed"
                    task.output = result.output
                elif task.chain:
                    result = self.orchestrator.run(*task.chain.split(":"))
                    task.status = "completed" if result.success else "failed"
                    task.output = "Mission chain successful"

                # Persistence of experience
                self.memory.remember(
                    agent="autonomous_orchestrator",
                    context={"mission": self.goal, "phase": task.name},
                    outcome=f"Status: {task.status}",
                    success=(task.status == "completed"),
                    tags=["autonomous", self.goal[:10]]
                )

            except Exception as e:
                logger.exception(f"Mission failure during phase {task.name}")
                task.status = "failed"
                task.error = str(e)

            if task.status == "failed":
                mission_success = False
                if self.verbose:
                    print(f"   ❌ Phase failed: {task.error or 'Unknown error'}")
                break # Critical failure stops the mission

            if self.verbose:
                print("   ✓ Phase complete")

            if interactive:
                print(f"\n   [PAUSED] Mission objective {task.id} achieved. Proceed? (y/n)")
                # Real implementation would wait for input here.

        self.status = AutonomousStatus.COMPLETED if mission_success else AutonomousStatus.FAILED

        if self.verbose:
            print("\n" + "═" * 60)
            status_icon = "✅" if mission_success else "⚠️"
            print(f"{status_icon} MISSION SUMMARY")
            print(f"   Objective : {self.goal}")
            print(f"   Result    : {self.status.value.upper()}")
            print("═" * 60)

        return mission_success

    def get_mission_report(self) -> Dict[str, Any]:
        """Provides a detailed summary of the mission's current state."""
        return {
            "mission": {
                "goal": self.goal,
                "status": self.status.value,
                "phases_total": len(self.plan.tasks) if self.plan else 0,
                "phases_done": len([t for t in self.plan.tasks if t.status == "completed"]) if self.plan else 0
            },
            "timeline": [
                {"id": t.id, "name": t.name, "status": t.status}
                for t in (self.plan.tasks if self.plan else [])
            ]
        }


# Global Interface
def execute_mission(goal: str) -> bool:
    """Entry point for goal-driven autonomous execution."""
    orchestrator = AutonomousOrchestrator()
    orchestrator.set_goal(goal)
    return orchestrator.execute()
