#!/usr/bin/env python3
"""
Claude Bridge System
Nối cầu CLI commands với .claude agent workflows
"""

import json
from pathlib import Path

class ClaudeBridge:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.bridge_dir = self.project_root / "claude_bridge"
        self.claude_dir = self.project_root / ".claude"
        self.skills_dir = self.project_root / ".claude-skills"
        
        # Command to workflow mappings
        self.command_mappings = {
            # AgencyOS CLI → Agent workflows
            "agencyos cook": {
                "agent": "cook",
                "workflow": "primary-workflow.md",
                "description": "Execute cooking recipe workflow"
            },
            "agencyos scaffold": {
                "agent": "architect", 
                "workflow": "primary-workflow.md",
                "description": "Generate project scaffolding"
            },
            "agencyos kanban": {
                "agent": "kanban-manager",
                "workflow": "kanban-workflow.md", 
                "description": "Manage kanban board"
            },
            "agencyos crm": {
                "agent": "crm-manager",
                "workflow": "crm-workflow.md",
                "description": "Manage CRM operations"
            },
            "agencyos revenue": {
                "agent": "revenue-manager",
                "workflow": "revenue-workflow.md",
                "description": "View revenue analytics"
            },
            "agencyos build": {
                "agent": "build-engineer",
                "workflow": "build-workflow.md",
                "description": "Build and deploy project"
            },
            "agencyos test": {
                "agent": "tester",
                "workflow": "testing-workflow.md",
                "description": "Run comprehensive tests"
            },
            "agencyos deploy": {
                "agent": "devops-engineer",
                "workflow": "deployment-workflow.md", 
                "description": "Deploy to production"
            },
            "agencyos review": {
                "agent": "code-reviewer",
                "workflow": "code-review-workflow.md",
                "description": "Review code changes"
            },
            "agencyos plan": {
                "agent": "planner",
                "workflow": "primary-workflow.md",
                "description": "Create implementation plan"
            },
            
            # Skill activations
            "/skill": {
                "type": "skill_activation",
                "description": "Activate specific skill"
            },
            
            # Default mappings
            "help": {
                "agent": "help-system",
                "workflow": "help-workflow.md",
                "description": "Show help and documentation"
            }
        }
        
        # Context management
        self.context_store = {}
        
    def create_bridge_structure(self):
        """Tạo cấu trúc cho bridge system"""
        directories = [
            "workflows",
            "context", 
            "reports",
            "mappers",
            "executors"
        ]
        
        for dir_name in directories:
            (self.bridge_dir / dir_name).mkdir(parents=True, exist_ok=True)
            
    def create_command_mapper(self):
        """Tạo command mapper"""
        mapper_content = '''#!/usr/bin/env python3
"""
Command Mapper - CLI commands to agent workflows
"""

import json
from pathlib import Path

class CommandMapper:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.mappings_file = bridge_dir / "command_mappings.json"
        self.load_mappings()
        
    def load_mappings(self):
        """Load command mappings"""
        if self.mappings_file.exists():
            self.mappings = json.loads(self.mappings_file.read_text())
        else:
            self.mappings = {}
            
    def save_mappings(self):
        """Save command mappings"""
        self.mappings_file.write_text(json.dumps(self.mappings, indent=2))
        
    def map_command(self, command: str) -> dict:
        """Map CLI command to agent workflow"""
        # Exact match first
        if command in self.mappings:
            return self.mappings[command]
            
        # Partial match for skills (/skill skill-name)
        if command.startswith("/skill "):
            skill_name = command.replace("/skill ", "").strip()
            return {
                "type": "skill_activation",
                "skill": skill_name,
                "agent": "skill-executor",
                "workflow": "skill-workflow.md"
            }
            
        # Fuzzy matching for agencyos commands
        if command.startswith("agencyos "):
            parts = command.split()
            if len(parts) >= 2:
                cmd = parts[1]
                for key, mapping in self.mappings.items():
                    if key.startswith(f"agencyos {cmd}"):
                        return mapping
                        
        # Default
        return {
            "type": "unknown",
            "agent": "help-system",
            "workflow": "help-workflow.md"
        }
        
    def add_mapping(self, command: str, mapping: dict):
        """Add new command mapping"""
        self.mappings[command] = mapping
        self.save_mappings()
'''
        
        mapper_path = self.bridge_dir / "mappers" / "command_mapper.py"
        mapper_path.write_text(mapper_content)
        
    def create_workflow_executor(self):
        """Tạo workflow executor"""
        executor_content = '''#!/usr/bin/env python3
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
'''
        
        executor_path = self.bridge_dir / "executors" / "workflow_executor.py"
        executor_path.write_text(executor_content)
        
    def create_context_manager(self):
        """Tạo context manager"""
        context_content = '''#!/usr/bin/env python3
"""
Context Manager - Manage shared context between systems
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Optional

class ContextManager:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.context_dir = bridge_dir / "context"
        self.shared_context_file = bridge_dir / "shared_context.json"
        
        # Ensure directory exists
        self.context_dir.mkdir(parents=True, exist_ok=True)
        
    def get_shared_context(self) -> Dict[str, Any]:
        """Get shared context"""
        if self.shared_context_file.exists():
            return json.loads(self.shared_context_file.read_text())
        return {}
        
    def update_shared_context(self, updates: Dict[str, Any]):
        """Update shared context"""
        context = self.get_shared_context()
        context.update(updates)
        context["last_updated"] = time.time()
        self.shared_context_file.write_text(json.dumps(context, indent=2))
        
    def get_execution_context(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get specific execution context"""
        context_file = self.context_dir / f"{execution_id}.json"
        if context_file.exists():
            return json.loads(context_file.read_text())
        return None
        
    def save_execution_context(self, execution_id: str, context: Dict[str, Any]):
        """Save execution context"""
        context_file = self.context_dir / f"{execution_id}.json"
        context_file.write_text(json.dumps(context, indent=2))
        
    def cleanup_old_context(self, max_age_hours: int = 24):
        """Clean up old context files"""
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for context_file in self.context_dir.glob("*.json"):
            file_age = current_time - context_file.stat().st_mtime
            if file_age > max_age_seconds:
                context_file.unlink()
                
    def get_active_skills(self) -> list:
        """Get list of currently active skills"""
        shared_context = self.get_shared_context()
        return shared_context.get("active_skills", [])
        
    def activate_skill(self, skill_name: str):
        """Activate a skill"""
        active_skills = self.get_active_skills()
        if skill_name not in active_skills:
            active_skills.append(skill_name)
            self.update_shared_context({"active_skills": active_skills})
            
    def deactivate_skill(self, skill_name: str):
        """Deactivate a skill"""
        active_skills = self.get_active_skills()
        if skill_name in active_skills:
            active_skills.remove(skill_name)
            self.update_shared_context({"active_skills": active_skills})
'''
        
        context_path = self.bridge_dir / "context_manager.py"
        context_path.write_text(context_content)
        
    def create_reporting_system(self):
        """Tạo reporting system"""
        reporting_content = '''#!/usr/bin/env python3
"""
Reporting System - Unified reporting for CLI and agent workflows
"""

import json
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any

class ReportingSystem:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.reports_dir = bridge_dir / "reports"
        self.summary_file = bridge_dir / "execution_summary.json"
        
        # Ensure directory exists
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_execution_summary(self) -> Dict[str, Any]:
        """Generate execution summary"""
        reports = []
        
        # Read all execution reports
        for report_file in self.reports_dir.glob("*.json"):
            try:
                report = json.loads(report_file.read_text())
                reports.append(report)
            except:
                continue
                
        # Calculate statistics
        total_executions = len(reports)
        successful = len([r for r in reports if r.get("status") == "success"])
        failed = total_executions - successful
        
        # Recent executions (last 24 hours)
        recent = []
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        for report in reports:
            timestamp = report.get("timestamp")
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    if dt > cutoff_time:
                        recent.append(report)
                except:
                    continue
                    
        # Command usage stats
        command_stats = {}
        for report in reports:
            command = report.get("command", "unknown")
            command_stats[command] = command_stats.get(command, 0) + 1
            
        # Skill usage stats
        skill_stats = {}
        for report in reports:
            if report.get("skill"):
                skill = report["skill"]
                skill_stats[skill] = skill_stats.get(skill, 0) + 1
                
        summary = {
            "generated_at": datetime.now().isoformat(),
            "total_executions": total_executions,
            "successful": successful,
            "failed": failed,
            "success_rate": successful / total_executions if total_executions > 0 else 0,
            "recent_24h": len(recent),
            "command_usage": command_stats,
            "skill_usage": skill_stats,
            "most_used_command": max(command_stats.items(), key=lambda x: x[1])[0] if command_stats else None,
            "most_used_skill": max(skill_stats.items(), key=lambda x: x[1])[0] if skill_stats else None
        }
        
        # Save summary
        self.summary_file.write_text(json.dumps(summary, indent=2))
        
        return summary
        
    def get_execution_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get execution history"""
        reports = []
        
        for report_file in sorted(self.reports_dir.glob("*.json"), reverse=True)[:limit]:
            try:
                report = json.loads(report_file.read_text())
                reports.append(report)
            except:
                continue
                
        return reports
        
    def format_report(self, report: Dict[str, Any]) -> str:
        """Format report for display"""
        status_emoji = "✅" if report.get("status") == "success" else "❌"
        command = report.get("command", "unknown")
        timestamp = report.get("timestamp", "")
        
        lines = [
            f"{status_emoji} {command}",
            f"   Time: {timestamp}",
        ]
        
        if report.get("skill"):
            lines.append(f"   Skill: {report['skill']}")
            
        if report.get("agent"):
            lines.append(f"   Agent: {report['agent']}")
            
        if report.get("error"):
            lines.append(f"   Error: {report['error']}")
            
        return "\\n".join(lines)
        
    def display_summary(self):
        """Display execution summary"""
        summary = self.generate_execution_summary()
        
        print("📊 Execution Summary")
        print("=" * 50)
        print(f"Total: {summary['total_executions']} executions")
        print(f"Success: {summary['successful']} ({summary['success_rate']:.1%})")
        print(f"Failed: {summary['failed']}")
        print(f"Recent (24h): {summary['recent_24h']}")
        
        if summary['most_used_command']:
            print(f"Most used command: {summary['most_used_command']}")
            
        if summary['most_used_skill']:
            print(f"Most used skill: {summary['most_used_skill']}")
'''
        
        reporting_path = self.bridge_dir / "reporting_system.py"
        reporting_path.write_text(reporting_content)
        
    def save_command_mappings(self):
        """Save command mappings to JSON"""
        mappings_file = self.bridge_dir / "command_mappings.json"
        mappings_file.write_text(json.dumps(self.command_mappings, indent=2))
        
    def run(self):
        """Setup complete bridge system"""
        print("🚀 Setting up Claude Bridge System...")
        
        # Create directory structure
        self.create_bridge_structure()
        
        # Create components
        self.create_command_mapper()
        self.create_workflow_executor()
        self.create_context_manager()
        self.create_reporting_system()
        
        # Save mappings
        self.save_command_mappings()
        
        print("✅ Claude Bridge System setup complete!")
        
        return {
            "bridge_dir": str(self.bridge_dir),
            "components": [
                "command_mapper",
                "workflow_executor", 
                "context_manager",
                "reporting_system"
            ],
            "command_mappings_count": len(self.command_mappings)
        }

if __name__ == "__main__":
    project_root = "/Users/macbookprom1/mekong-cli"
    bridge = ClaudeBridge(project_root)
    result = bridge.run()
    
    print("\\n📈 Summary:")
    print(f"- Bridge directory: {result['bridge_dir']}")
    print(f"- Components created: {len(result['components'])}")
    print(f"- Command mappings: {result['command_mappings_count']}")