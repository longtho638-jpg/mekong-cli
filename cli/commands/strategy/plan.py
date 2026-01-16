"""
Plan command for task planning (Manus 3-file pattern).
"""

from typing import List
from datetime import datetime
from pathlib import Path
from cli.commands.base import BaseCommand


class PlanCommand(BaseCommand):
    """Plan command for task management."""
    
    @property
    def description(self) -> str:
        return "Create or view task plan (Manus 3-file pattern)"
    
    def execute(self, args: List[str]) -> None:
        print("\n📋 Task Plan (Manus 3-File Pattern)")
        print("-" * 50)
        
        plans_dir = Path("plans")
        plans_dir.mkdir(exist_ok=True)
        
        task_plan = plans_dir / "task_plan.md"
        notes = plans_dir / "notes.md"
        
        if args:
            task = " ".join(args)
            
            content = f"""# Task Plan: {task}

Created: {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Goal
{task}

## Phases
- [ ] Phase 1: Research & Planning
- [ ] Phase 2: Implementation
- [ ] Phase 3: Testing
- [ ] Phase 4: Review & Delivery

## Progress Notes
<!-- Update after each phase -->

## Errors Log
<!-- Track any errors for future reference -->
"""
            task_plan.write_text(content, encoding="utf-8")
            
            if not notes.exists():
                notes.write_text("# Research Notes\n\n", encoding="utf-8")
            
            self.console.print("   ✅ Created: plans/task_plan.md")
            self.console.print("   ✅ Created: plans/notes.md")
            print(f"\n   Task: {task}")
            print("\n   Next: agencyos cook @plans/task_plan.md")
        else:
            if task_plan.exists():
                self.console.print(task_plan.read_text(encoding="utf-8"))
            else:
                self.console.print("   No task plan found.")
                print('   Create one: agencyos plan "Your task"')