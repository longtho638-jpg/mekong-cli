"""
🏯 Agent Orchestrator - Auto-Execute Agent Chains

Automatically runs the optimal agent chain for any command.
Handles step-by-step execution with status reporting.

Usage:
    from antigravity.core.agent_orchestrator import AgentOrchestrator
    orchestrator = AgentOrchestrator()
    result = orchestrator.run("dev", "cook", {"task": "build auth"})
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

from .agent_chains import (
    AGENT_CHAINS, AGENT_INVENTORY, AgentStep, 
    get_chain, get_chain_summary, AgentCategory
)


class StepStatus(Enum):
    """Status of a chain step."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StepResult:
    """Result of a single step."""
    agent: str
    action: str
    status: StepStatus
    output: Optional[str] = None
    duration_ms: int = 0
    error: Optional[str] = None


@dataclass
class ChainResult:
    """Result of a full chain execution."""
    suite: str
    subcommand: str
    steps: List[StepResult]
    success: bool
    total_duration_ms: int
    started_at: datetime
    completed_at: Optional[datetime] = None


class AgentOrchestrator:
    """
    🏯 Agent Orchestrator
    Auto-executes optimal agent chains for any command.
    """
    
    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.history: List[ChainResult] = []
    
    def run(
        self, 
        suite: str, 
        subcommand: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> ChainResult:
        """
        Execute the agent chain for a command.
        
        Args:
            suite: Suite name (e.g., "dev")
            subcommand: Subcommand (e.g., "cook")
            context: Optional context dict with task details
        
        Returns:
            ChainResult with all step results
        """
        chain = get_chain(suite, subcommand)
        
        if not chain:
            return self._empty_result(suite, subcommand)
        
        started_at = datetime.now()
        steps_results: List[StepResult] = []
        
        if self.verbose:
            self._print_header(suite, subcommand, len(chain))
        
        for i, step in enumerate(chain, 1):
            result = self._execute_step(step, i, len(chain), context)
            steps_results.append(result)
            
            # Stop on failure (unless optional)
            if result.status == StepStatus.FAILED and not step.optional:
                break
        
        completed_at = datetime.now()
        total_ms = int((completed_at - started_at).total_seconds() * 1000)
        
        success = all(
            r.status in [StepStatus.COMPLETED, StepStatus.SKIPPED] 
            for r in steps_results
        )
        
        chain_result = ChainResult(
            suite=suite,
            subcommand=subcommand,
            steps=steps_results,
            success=success,
            total_duration_ms=total_ms,
            started_at=started_at,
            completed_at=completed_at,
        )
        
        self.history.append(chain_result)
        
        if self.verbose:
            self._print_summary(chain_result)
        
        return chain_result
    
    def _execute_step(
        self, 
        step: AgentStep, 
        index: int, 
        total: int,
        context: Optional[Dict]
    ) -> StepResult:
        """Execute a single step."""
        if self.verbose:
            print(f"   [{index}/{total}] {step.agent}: {step.description}...")
        
        # Simulate agent execution (in real impl, would call actual agent)
        # For now, we mark all as completed
        import time
        start = time.time()
        
        # Here you would actually invoke the agent
        # agent = load_agent(step.agent)
        # output = agent.run(step.action, context)
        
        duration_ms = int((time.time() - start) * 1000)
        
        if self.verbose:
            print(f"   ✓ {step.agent} complete")
        
        return StepResult(
            agent=step.agent,
            action=step.action,
            status=StepStatus.COMPLETED,
            output=f"Executed {step.action}",
            duration_ms=duration_ms,
        )
    
    def _print_header(self, suite: str, subcommand: str, steps: int):
        """Print chain execution header."""
        print(f"\n🔗 AGENT CHAIN: /{suite}:{subcommand}")
        print("═" * 50)
        print(f"   Steps: {steps} agents")
        print("─" * 50)
    
    def _print_summary(self, result: ChainResult):
        """Print chain execution summary."""
        print("─" * 50)
        status = "✅ SUCCESS" if result.success else "❌ FAILED"
        print(f"   {status} ({result.total_duration_ms}ms)")
        print("═" * 50)
    
    def _empty_result(self, suite: str, subcommand: str) -> ChainResult:
        """Return empty result for undefined chain."""
        return ChainResult(
            suite=suite,
            subcommand=subcommand,
            steps=[],
            success=False,
            total_duration_ms=0,
            started_at=datetime.now(),
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get orchestrator statistics."""
        total_runs = len(self.history)
        successful = sum(1 for r in self.history if r.success)
        
        # Count agent usage
        agent_usage: Dict[str, int] = {}
        for result in self.history:
            for step in result.steps:
                agent_usage[step.agent] = agent_usage.get(step.agent, 0) + 1
        
        return {
            "total_runs": total_runs,
            "successful": successful,
            "success_rate": successful / total_runs if total_runs > 0 else 0,
            "agent_usage": agent_usage,
            "total_agents": len(AGENT_INVENTORY),
            "total_chains": len(AGENT_CHAINS),
        }
    
    def print_dashboard(self):
        """Print agent dashboard."""
        stats = self.get_stats()
        
        print("\n🏯 AGENT ORCHESTRATOR DASHBOARD")
        print("═" * 60)
        print(f"   Total Agents: {stats['total_agents']}")
        print(f"   Total Chains: {stats['total_chains']}")
        print(f"   Runs: {stats['total_runs']}")
        print(f"   Success Rate: {stats['success_rate']:.1%}")
        print()
        
        # Agent categories
        print("📊 AGENTS BY CATEGORY:")
        for cat in AgentCategory:
            from .agent_chains import get_agents_by_category
            agents = get_agents_by_category(cat)
            print(f"   {cat.value}: {len(agents)}")
        
        print("═" * 60)


def run_chain(suite: str, subcommand: str, context: Dict = None) -> ChainResult:
    """Quick function to run a chain."""
    orchestrator = AgentOrchestrator()
    return orchestrator.run(suite, subcommand, context)
