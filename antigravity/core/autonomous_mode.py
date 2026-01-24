"""
Autonomous Mode - Goal-Based Execution
========================================

Enables high-level goal setting and autonomous mission execution.
The orchestrator analyzes the goal, decomposes it into a multi-stage plan,
and activates the appropriate agent crews or individual chains.

Mission Workflow:
1. Deconstruct: Goal -> Task List.
2. Delegate: Task -> Agent Crew / Chain.
3. Observe: Capture outcome and learn via Memory.
4. Iterate: Adjust next tasks based on results.

Binh Phap: Cuu Bien (Variations) - Adapting to the situation.
"""

import logging
from typing import Any, Dict, List, Optional, TypedDict

from .agent_crews import CrewStatus, run_crew
from .agent_memory import get_agent_memory
from .agent_orchestrator import AgentOrchestrator
from .autonomous_models import AutonomousStatus, ExecutionPlan, Task

# Configure logging
logger = logging.getLogger(__name__)


class MissionStateDict(TypedDict):
    goal: Optional[str]
    status: str
    phases_total: int
    phases_done: int


class TimelineEventDict(TypedDict):
    id: int
    name: str
    status: str


class MissionReportDict(TypedDict):
    """Detailed summary of mission state"""
    mission: MissionStateDict
    timeline: List[TimelineEventDict]


class AutonomousOrchestrator:
    """
    Autonomous Mission Orchestrator

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
            logger.info(f"\n[MISSION OBJECTIVE]: {goal}")
            logger.info("=" * 60)

        self.plan = ExecutionPlan(goal=goal, tasks=self._analyze_goal(goal))

        if self.verbose:
            logger.info(f"[STRATEGIC PLAN] ({len(self.plan.tasks)} phases):")
            for task in self.plan.tasks:
                origin = f"Crew: {task.crew}" if task.crew else f"Chain: {task.chain}"
                logger.info(f"   {task.id}. {task.name:<25} | {origin}")
            logger.info("")

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
            logger.info("[INITIATING AUTONOMOUS DEPLOYMENT]")
            logger.info("-" * 60)

        for task in self.plan.tasks:
            task.status = "executing"
            if self.verbose:
                logger.info(f"[Phase {task.id}]: {task.name}...")

            try:
                if task.crew:
                    result = run_crew(task.crew)
                    task.status = "completed" if result.status == CrewStatus.COMPLETED else "failed"
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
                    tags=["autonomous", self.goal[:10]],
                )

            except Exception as e:
                logger.exception(f"Mission failure during phase {task.name}")
                task.status = "failed"
                task.error = str(e)

            if task.status == "failed":
                mission_success = False
                if self.verbose:
                    logger.error(f"   [FAILED] Phase failed: {task.error or 'Unknown error'}")
                break

            if self.verbose:
                logger.info("   [OK] Phase complete")

            if interactive:
                # print is acceptable here because it is interactive input
                print(f"\n   [PAUSED] Mission objective {task.id} achieved. Proceed? (y/n)")

        self.status = AutonomousStatus.COMPLETED if mission_success else AutonomousStatus.FAILED

        if self.verbose:
            logger.info("\n" + "=" * 60)
            status_icon = "[SUCCESS]" if mission_success else "[WARNING]"
            logger.info(f"{status_icon} MISSION SUMMARY")
            logger.info(f"   Objective : {self.goal}")
            logger.info(f"   Result    : {self.status.value.upper()}")
            logger.info("=" * 60)

        return mission_success

    def get_mission_report(self) -> MissionReportDict:
        """Provides a detailed summary of the mission's current state."""
        return {
            "mission": {
                "goal": self.goal,
                "status": self.status.value,
                "phases_total": len(self.plan.tasks) if self.plan else 0,
                "phases_done": len([t for t in self.plan.tasks if t.status == "completed"])
                if self.plan
                else 0,
            },
            "timeline": [
                {"id": t.id, "name": t.name, "status": t.status}
                for t in (self.plan.tasks if self.plan else [])
            ],
        }


# Global Interface
def execute_mission(goal: str) -> bool:
    """Entry point for goal-driven autonomous execution."""
    orchestrator = AutonomousOrchestrator()
    orchestrator.set_goal(goal)
    return orchestrator.execute()
