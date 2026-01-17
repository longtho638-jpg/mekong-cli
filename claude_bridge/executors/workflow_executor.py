#!/usr/bin/env python3
"""
Workflow Executor - Execute agent workflows
"""

import os
import json
import subprocess
from pathlib import Path
from datetime import datetime

class WorkflowExecutor:
    def __init__(self, bridge_dir: Path, project_root: Path):
        self.bridge_dir = bridge_dir
        self.project_root = project_root
        self.claude_dir = project_root / ".claude"
        self.reports_dir = bridge_dir / "reports"
        
    def execute_workflow(self, command: str, mapping: dict, **kwargs) -> dict:
        """Execute agent workflow"""
        execution_id = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{command.replace(' ', '-')}"
        
        # Create execution context
        context = {
            "execution_id": execution_id,
            "command": command,
            "mapping": mapping,
            "timestamp": datetime.now().isoformat(),
            "kwargs": kwargs
        }
        
        # Save context
        context_file = self.bridge_dir / "context" / f"{execution_id}.json"
        context_file.write_text(json.dumps(context, indent=2))
        
        try:
            # Execute based on mapping type
            if mapping.get("type") == "skill_activation":
                result = self.execute_skill_activation(mapping, context)
            else:
                result = self.execute_agent_workflow(mapping, context)
                
            # Save report
            self.save_report(execution_id, result)
            return result
            
        except Exception as e:
            error_result = {
                "status": "error",
                "error": str(e),
                "execution_id": execution_id
            }
            self.save_report(execution_id, error_result)
            return error_result
            
    def execute_skill_activation(self, mapping: dict, context: dict) -> dict:
        """Execute skill activation"""
        skill_name = mapping.get("skill")
        if not skill_name:
            raise ValueError("Skill name required for skill activation")
            
        # Check if skill exists in unified skills
        skills_dir = self.project_root / ".claude-skills"
        skill_path = skills_dir / skill_name
        
        if not skill_path.exists():
            return {
                "status": "error",
                "error": f"Skill '{skill_name}' not found",
                "available_skills": [d.name for d in skills_dir.iterdir() if d.is_dir()]
            }
            
        # Simulate skill activation
        return {
            "status": "success",
            "skill": skill_name,
            "message": f"Skill '{skill_name}' activated successfully",
            "skill_path": str(skill_path),
            "next_actions": [
                f"Use {skill_name} capabilities in your responses",
                f"Follow {skill_path}/SKILL.md guidelines",
                "Execute skill-specific workflows"
            ]
        }
        
    def execute_agent_workflow(self, mapping: dict, context: dict) -> dict:
        """Execute agent workflow"""
        agent = mapping.get("agent")
        workflow = mapping.get("workflow")
        
        if not agent or not workflow:
            raise ValueError("Agent and workflow required")
            
        # Get workflow file
        workflow_file = self.claude_dir / "workflows" / workflow
        if not workflow_file.exists():
            # Fallback to primary workflow
            workflow_file = self.claude_dir / "workflows" / "primary-workflow.md"
            
        if not workflow_file.exists():
            raise ValueError(f"Workflow file not found: {workflow}")
            
        # Simulate workflow execution
        return {
            "status": "success",
            "agent": agent,
            "workflow": workflow,
            "message": f"Agent '{agent}' workflow initiated",
            "workflow_file": str(workflow_file),
            "execution_context": context,
            "next_actions": [
                f"Delegate to {agent} agent",
                f"Follow {workflow} guidelines",
                "Execute workflow steps"
            ]
        }
        
    def save_report(self, execution_id: str, result: dict):
        """Save execution report"""
        report_file = self.reports_dir / f"{execution_id}.json"
        report_file.write_text(json.dumps(result, indent=2, default=str))
