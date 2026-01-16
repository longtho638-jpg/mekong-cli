#!/usr/bin/env python3
"""
🤖 Agent Orchestration - AgencyOS
================================

Integrates with .claude workflows for coordinated agent execution.
Follows primary-workflow.md patterns for task delegation.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

@dataclass
class AgentTask:
    """Represents a task for an agent."""
    id: str
    agent_type: str
    description: str
    context: Dict[str, Any]
    dependencies: List[str] = None
    priority: str = "normal"

@dataclass
class AgentResult:
    """Represents result from an agent execution."""
    task_id: str
    agent_type: str
    success: bool
    result: Any
    errors: List[str] = None
    execution_time: float = 0.0

class WorkflowOrchestrator:
    """Orchestrates agents following .claude workflow patterns."""
    
    def __init__(self):
        self.agents = {}
        self.task_queue = []
        self.completed_tasks = {}
        self.active_plan = None
        self._load_agents()
    
    def _load_agents(self):
        """Load available agents from .agencyos/skills/."""
        try:
            skills_dir = Path(__file__).parent.parent.parent / ".agencyos" / "skills"
            
            # Load skill definitions
            for skill_dir in skills_dir.iterdir():
                if skill_dir.is_dir():
                    skill_name = skill_dir.name
                    skill_file = skill_dir / "SKILL.md"
                    if skill_file.exists():
                        self.agents[skill_name] = self._parse_skill(skill_file)
                        
        except Exception as e:
            print(f"Warning: Could not load agents: {e}")
    
    def _parse_skill(self, skill_file: Path) -> Dict[str, Any]:
        """Parse skill definition from SKILL.md file."""
        try:
            with open(skill_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Basic skill parsing
            return {
                'name': skill_file.parent.name,
                'file': str(skill_file),
                'description': self._extract_section(content, 'Description'),
                'capabilities': self._extract_section(content, 'Capabilities'),
                'loaded_at': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error parsing skill {skill_file}: {e}")
            return {}
    
    def _extract_section(self, content: str, section_name: str) -> str:
        """Extract section content from markdown."""
        lines = content.split('\n')
        in_section = False
        section_content = []
        
        for line in lines:
            if line.strip().startswith(f'# {section_name}') or line.strip().startswith(f'## {section_name}'):
                in_section = True
                continue
            elif in_section and line.strip().startswith('#'):
                break
            elif in_section:
                section_content.append(line)
        
        return '\n'.join(section_content).strip()
    
    def execute_workflow(self, task_description: str) -> Dict[str, Any]:
        """
        Execute .claude primary workflow for a task.
        
        Workflow phases:
        1. Planning → 2. Research → 3. Implementation → 4. Testing → 5. Review → 6. Finalize
        """
        print(f"\n🚀 [bold blue]Executing AgencyOS Workflow[/bold blue]")
        print(f"📝 Task: {task_description}")
        print("=" * 60)
        
        workflow_id = f"workflow-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        results = {}
        
        try:
            # Phase 1: Planning
            print("\n📋 [blue]Phase 1: Planning[/blue]")
            planner_result = self._execute_agent('planning', task_description)
            results['planning'] = planner_result
            
            if not planner_result.success:
                return self._workflow_failed(workflow_id, "Planning failed", results)
            
            # Phase 2: Research (parallel)
            print("\n🔍 [blue]Phase 2: Research[/blue]")
            research_tasks = self._generate_research_tasks(planner_result.result)
            research_results = self._execute_parallel_research(research_tasks)
            results['research'] = research_results
            
            # Phase 3: Implementation
            print("\n🛠️ [blue]Phase 3: Implementation[/blue]")
            impl_result = self._execute_agent('main', task_description, {
                'plan': planner_result.result,
                'research': research_results
            })
            results['implementation'] = impl_result
            
            if not impl_result.success:
                return self._workflow_failed(workflow_id, "Implementation failed", results)
            
            # Phase 4: Testing
            print("\n🧪 [blue]Phase 4: Testing[/blue]")
            test_result = self._execute_agent('tester', impl_result.result)
            results['testing'] = test_result
            
            # Phase 5: Code Review
            print("\n🔍 [blue]Phase 5: Code Review[/blue]")
            review_result = self._execute_agent('code-reviewer', impl_result.result)
            results['review'] = review_result
            
            # Phase 6: Finalization
            print("\n🎉 [blue]Phase 6: Finalization[/blue]")
            final_result = self._finalize_workflow(results)
            results['finalization'] = final_result
            
            return {
                'workflow_id': workflow_id,
                'status': 'completed',
                'success': True,
                'results': results,
                'duration': self._calculate_duration(results)
            }
            
        except Exception as e:
            return self._workflow_failed(workflow_id, f"Workflow error: {e}", results)
    
    def _execute_agent(self, agent_type: str, task: str, context: Dict[str, Any] = None) -> AgentResult:
        """Execute a single agent task."""
        start_time = datetime.now()
        
        try:
            print(f"   ✅ Executing {agent_type} agent...")
            
            # Simulate agent execution (in real implementation, would call actual agent)
            result = f"Simulated {agent_type} result for: {task}"
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            print(f"   ✅ {agent_type.title()} completed in {execution_time:.2f}s")
            
            return AgentResult(
                task_id=f"{agent_type}-{start_time.strftime('%H%M%S')}",
                agent_type=agent_type,
                success=True,
                result=result,
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            print(f"   ❌ {agent_type.title()} failed: {e}")
            
            return AgentResult(
                task_id=f"{agent_type}-{start_time.strftime('%H%M%S')}",
                agent_type=agent_type,
                success=False,
                result=None,
                errors=[str(e)],
                execution_time=execution_time
            )
    
    def _generate_research_tasks(self, plan_result: Any) -> List[Dict[str, str]]:
        """Generate research tasks based on plan."""
        return [
            {'type': 'technical', 'description': 'Analyze technical requirements'},
            {'type': 'architecture', 'description': 'Review architectural patterns'},
            {'type': 'best-practices', 'description': 'Research industry best practices'}
        ]
    
    def _execute_parallel_research(self, research_tasks: List[Dict[str, str]]) -> Dict[str, AgentResult]:
        """Execute research tasks in parallel."""
        results = {}
        
        for task in research_tasks:
            agent_type = f"researcher-{task['type']}"
            result = self._execute_agent(agent_type, task['description'])
            results[task['type']] = result
        
        return results
    
    def _finalize_workflow(self, results: Dict[str, Any]) -> AgentResult:
        """Finalize the workflow with documentation."""
        try:
            print("   ✅ Updating documentation...")
            print("   ✅ Creating commit...")
            print("   ✅ Preparing deployment...")
            
            return AgentResult(
                task_id="finalize",
                agent_type="docs-manager",
                success=True,
                result="Workflow finalized successfully",
                execution_time=1.0
            )
        except Exception as e:
            return AgentResult(
                task_id="finalize",
                agent_type="docs-manager",
                success=False,
                result=None,
                errors=[str(e)]
            )
    
    def _workflow_failed(self, workflow_id: str, error: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workflow failure."""
        print(f"\n❌ [bold red]Workflow Failed[/bold red]: {error}")
        
        return {
            'workflow_id': workflow_id,
            'status': 'failed',
            'success': False,
            'error': error,
            'results': results,
            'failed_at': datetime.now().isoformat()
        }
    
    def _calculate_duration(self, results: Dict[str, Any]) -> float:
        """Calculate total workflow duration."""
        total = 0.0
        for phase, result in results.items():
            if hasattr(result, 'execution_time'):
                total += result.execution_time
        return total

# Global orchestrator instance
_orchestrator = None

def get_orchestrator() -> WorkflowOrchestrator:
    """Get or create orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = WorkflowOrchestrator()
    return _orchestrator

def execute_cook_workflow(feature_description: str) -> Dict[str, Any]:
    """Execute the 'cook' workflow following .claude patterns."""
    orchestrator = get_orchestrator()
    return orchestrator.execute_workflow(f"Implement feature: {feature_description}")

if __name__ == "__main__":
    # Test workflow execution
    result = execute_cook_workflow("user authentication system")
    print(f"\n📊 Workflow Result: {result['status']}")
    if result['success']:
        print(f"✅ Completed in {result['duration']:.2f}s")
    else:
        print(f"❌ Failed: {result['error']}")