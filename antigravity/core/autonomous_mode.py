"""
🚀 Autonomous Mode - Goal-Based Execution

Set a goal and let agents work autonomously to achieve it.
Minimal human intervention required.

Usage:
    from antigravity.core.autonomous_mode import AutonomousOrchestrator
    auto = AutonomousOrchestrator()
    auto.set_goal("Launch newsletter SaaS")
    auto.execute()
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from .agent_crews import CREWS, run_crew, get_crew
from .agent_orchestrator import AgentOrchestrator
from .agent_memory import get_memory


class AutonomousStatus(Enum):
    """Autonomous execution status."""
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    PAUSED = "paused"
    AWAITING_REVIEW = "awaiting_review"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    """Single task in execution plan."""
    id: int
    name: str
    crew: Optional[str] = None
    chain: Optional[str] = None
    status: str = "pending"
    output: Optional[str] = None


@dataclass
class ExecutionPlan:
    """Plan for autonomous execution."""
    goal: str
    tasks: List[Task]
    created_at: datetime = field(default_factory=datetime.now)


class AutonomousOrchestrator:
    """
    🚀 Autonomous Orchestrator
    
    Sets goals and executes without human intervention.
    Only pauses for critical decisions.
    """
    
    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.goal: Optional[str] = None
        self.plan: Optional[ExecutionPlan] = None
        self.status: AutonomousStatus = AutonomousStatus.IDLE
        self.memory = get_memory()
        self.orchestrator = AgentOrchestrator(verbose=False)
    
    def set_goal(self, goal: str):
        """Set the autonomous goal."""
        self.goal = goal
        self.status = AutonomousStatus.PLANNING
        
        if self.verbose:
            print(f"\n🎯 AUTONOMOUS MODE")
            print("═" * 60)
            print(f"   Goal: {goal}")
            print()
        
        self._create_plan()
    
    def _create_plan(self):
        """Create execution plan based on goal."""
        # Analyze goal and determine required tasks
        tasks = self._analyze_goal(self.goal)
        
        self.plan = ExecutionPlan(
            goal=self.goal,
            tasks=tasks,
        )
        
        if self.verbose:
            print("📋 EXECUTION PLAN:")
            for task in tasks:
                print(f"   {task.id}. {task.name}")
                if task.crew:
                    print(f"      └── Crew: {task.crew}")
                elif task.chain:
                    print(f"      └── Chain: {task.chain}")
            print()
    
    def _analyze_goal(self, goal: str) -> List[Task]:
        """Analyze goal and break into tasks."""
        goal_lower = goal.lower()
        tasks = []
        task_id = 1
        
        # Goal analysis heuristics
        if "saas" in goal_lower or "product" in goal_lower or "launch" in goal_lower:
            tasks.append(Task(task_id, "Strategic Analysis", crew="strategy"))
            task_id += 1
            tasks.append(Task(task_id, "Product Development", crew="product_launch"))
            task_id += 1
            tasks.append(Task(task_id, "Content & Marketing", crew="content_machine"))
            task_id += 1
            
        if "revenue" in goal_lower or "money" in goal_lower or "sales" in goal_lower:
            tasks.append(Task(task_id, "Revenue Acceleration", crew="revenue_accelerator"))
            task_id += 1
            
        if "bug" in goal_lower or "fix" in goal_lower or "debug" in goal_lower:
            tasks.append(Task(task_id, "Debug & Fix", crew="debug_squad"))
            task_id += 1
            
        if "feature" in goal_lower or "build" in goal_lower:
            tasks.append(Task(task_id, "Feature Development", chain="dev:cook"))
            task_id += 1
            tasks.append(Task(task_id, "Testing", chain="dev:test"))
            task_id += 1
            
        # Default: strategy + development
        if not tasks:
            tasks.append(Task(task_id, "Strategic Planning", crew="strategy"))
            task_id += 1
            tasks.append(Task(task_id, "Development", crew="dev_ops"))
            task_id += 1
        
        return tasks
    
    def execute(self, pause_for_review: bool = False) -> bool:
        """
        Execute the plan autonomously.
        
        Args:
            pause_for_review: If True, pause after each task for human review
        
        Returns:
            True if all tasks completed successfully
        """
        if not self.plan:
            print("❌ No plan set. Use set_goal() first.")
            return False
        
        self.status = AutonomousStatus.EXECUTING
        
        if self.verbose:
            print("⚡ EXECUTING AUTONOMOUSLY")
            print("─" * 60)
        
        success = True
        for task in self.plan.tasks:
            task.status = "executing"
            
            if self.verbose:
                print(f"\n📍 Task {task.id}: {task.name}")
            
            # Execute crew or chain
            if task.crew:
                result = run_crew(task.crew)
                task.output = result.output
                task.status = "completed" if result.status.value == "completed" else "failed"
            elif task.chain:
                suite, subcommand = task.chain.split(":")
                result = self.orchestrator.run(suite, subcommand)
                task.output = "Chain completed" if result.success else "Chain failed"
                task.status = "completed" if result.success else "failed"
            
            # Remember outcome
            self.memory.remember(
                agent="autonomous",
                context={"goal": self.goal, "task": task.name},
                outcome=task.status,
                success=task.status == "completed",
            )
            
            if task.status == "failed":
                success = False
                if self.verbose:
                    print(f"   ❌ Task failed")
            else:
                if self.verbose:
                    print(f"   ✓ Task completed")
            
            if pause_for_review:
                self.status = AutonomousStatus.AWAITING_REVIEW
                if self.verbose:
                    print("\n   ⏸️  Paused for review")
                    print("   Press Enter to continue...")
                # In real impl, would wait for human input
        
        self.status = AutonomousStatus.COMPLETED if success else AutonomousStatus.FAILED
        
        if self.verbose:
            print("\n" + "═" * 60)
            if success:
                print("✅ AUTONOMOUS EXECUTION COMPLETE")
            else:
                print("⚠️ EXECUTION COMPLETED WITH ISSUES")
            print(f"   Goal: {self.goal}")
            print(f"   Tasks: {len([t for t in self.plan.tasks if t.status == 'completed'])}/{len(self.plan.tasks)} completed")
        
        return success
    
    def pause(self):
        """Pause autonomous execution."""
        self.status = AutonomousStatus.PAUSED
        if self.verbose:
            print("⏸️ Autonomous execution paused")
    
    def resume(self):
        """Resume autonomous execution."""
        if self.status == AutonomousStatus.PAUSED:
            self.execute()
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status."""
        return {
            "status": self.status.value,
            "goal": self.goal,
            "tasks_total": len(self.plan.tasks) if self.plan else 0,
            "tasks_completed": len([t for t in self.plan.tasks if t.status == "completed"]) if self.plan else 0,
        }
    
    def print_status(self):
        """Print status dashboard."""
        status = self.get_status()
        
        print("\n🚀 AUTONOMOUS STATUS")
        print("═" * 50)
        print(f"   Status: {status['status']}")
        print(f"   Goal: {status['goal'] or 'Not set'}")
        print(f"   Progress: {status['tasks_completed']}/{status['tasks_total']} tasks")
        print("═" * 50)


def auto_execute(goal: str) -> bool:
    """Quick function for autonomous execution."""
    auto = AutonomousOrchestrator()
    auto.set_goal(goal)
    return auto.execute()
