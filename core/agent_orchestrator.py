"""
🤖 Agent Orchestration
======================
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from core.ai.llm import LLMClient

logger = logging.getLogger("AgentOrchestrator")

@dataclass
class AgentResult:
    task_id: str
    success: bool
    result: Any
    execution_time: float

class AgentRegistry:
    def __init__(self):
        self.agents: Dict[str, Path] = {}
        self._scan()

    def _scan(self):
        root = Path.cwd()
        for d in [root / ".claude/agents", root / ".agent/subagents"]:
            if d.exists():
                for f in d.rglob("*.md"):
                    self.agents[f.stem] = f

    def get_agent(self, name: str) -> Optional[Path]:
        return self.agents.get(name)
    
    def get_agent_prompt(self, name: str) -> str:
        path = self.get_agent(name)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return ""

class WorkflowOrchestrator:
    def __init__(self):
        self.registry = AgentRegistry()
        self.llm = LLMClient()

    def execute_workflow(self, task: str) -> Dict[str, Any]:
        logger.info(f"Executing workflow for: {task}")
        start = datetime.now()
        
        # 1. Planning
        planner_prompt = self.registry.get_agent_prompt("binh-phap-strategist") or "You are a strategic planner."
        plan = self.llm.complete(f"Plan this task: {task}", system_instruction=planner_prompt)
        
        # 2. Execution (Simplified)
        result = self.llm.complete(f"Execute this plan: {plan}")
        
        return {
            "status": "completed",
            "task": task,
            "duration": (datetime.now() - start).total_seconds(),
            "results": {
                "planning": plan[:100] + "...", 
                "implementation": result[:100] + "..."
            }
        }

_instance = None
def get_orchestrator():
    global _instance
    if not _instance:
        _instance = WorkflowOrchestrator()
    return _instance
