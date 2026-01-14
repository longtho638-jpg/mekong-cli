"""
🤖 Jules Runner - Automated Tech Debt Cleanup

Run Jules tasks locally with scheduling support.

Usage:
    python -m antigravity.core.jules_runner --task tests
    python -m antigravity.core.jules_runner --weekly
"""

import subprocess
import argparse
from datetime import datetime
from typing import Optional


# Jules task templates
JULES_TASKS = {
    "tests": {
        "name": "Add Unit Tests",
        "prompt": "add comprehensive unit tests for all new files in antigravity/core/ that don't have tests",
        "schedule": "Monday",
    },
    "lint": {
        "name": "Fix Lint Errors", 
        "prompt": "fix all TypeScript any types and Python type hints in the codebase",
        "schedule": "Wednesday",
    },
    "docs": {
        "name": "Update Documentation",
        "prompt": "add docstrings to all Python functions missing documentation in antigravity/core/",
        "schedule": "Friday",
    },
    "deps": {
        "name": "Update Dependencies",
        "prompt": "update all npm and pip dependencies to latest stable versions with security patches",
        "schedule": "Monthly (1st)",
    },
    "security": {
        "name": "Security Scan",
        "prompt": "fix all security vulnerabilities from npm audit and scan for hardcoded secrets",
        "schedule": "Monthly (15th)",
    },
    "cleanup": {
        "name": "Code Cleanup",
        "prompt": "remove all unused imports, dead code, and console.log statements",
        "schedule": "Weekly",
    },
}


def run_jules_task(task_type: str, dry_run: bool = False) -> bool:
    """
    Run a Jules task.
    
    Args:
        task_type: Type of task (tests, lint, docs, deps, security)
        dry_run: If True, just print command without running
    
    Returns:
        True if successful
    """
    if task_type not in JULES_TASKS:
        print(f"❌ Unknown task type: {task_type}")
        print(f"   Available: {', '.join(JULES_TASKS.keys())}")
        return False
    
    task = JULES_TASKS[task_type]
    
    print(f"\n🤖 JULES TASK: {task['name']}")
    print(f"   Schedule: {task['schedule']}")
    print(f"   Prompt: {task['prompt'][:50]}...")
    print("")
    
    # Build command
    cmd = f'gemini -p "/jules {task["prompt"]}"'
    
    if dry_run:
        print(f"   [DRY RUN] Would execute:")
        print(f"   $ {cmd}")
        return True
    
    try:
        print(f"   Executing...")
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120  # 2 min timeout for initial request
        )
        
        if result.returncode == 0:
            print(f"   ✅ Task submitted successfully!")
            print(f"   📋 Check status with: /jules what is the status?")
            return True
        else:
            print(f"   ❌ Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"   ⏱️ Task submitted (running in background)")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def run_weekly_tasks(dry_run: bool = False):
    """Run appropriate task based on current day."""
    day = datetime.now().strftime("%A")
    
    day_map = {
        "Monday": "tests",
        "Tuesday": None,
        "Wednesday": "lint",
        "Thursday": None,
        "Friday": "docs",
        "Saturday": "cleanup",
        "Sunday": None,
    }
    
    task = day_map.get(day)
    
    if task:
        print(f"📅 {day} - Running scheduled task: {task}")
        return run_jules_task(task, dry_run)
    else:
        print(f"📅 {day} - No scheduled task")
        return True


def check_status():
    """Check Jules task status."""
    cmd = 'gemini -p "/jules what is the status of my tasks?"'
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        print(result.stdout)
    except Exception as e:
        print(f"❌ Error checking status: {e}")


def list_tasks():
    """List available Jules tasks."""
    print("\n🤖 AVAILABLE JULES TASKS")
    print("=" * 50)
    
    for key, task in JULES_TASKS.items():
        print(f"\n  {key}:")
        print(f"    Name: {task['name']}")
        print(f"    Schedule: {task['schedule']}")
        print(f"    Prompt: {task['prompt'][:60]}...")
    
    print("\n" + "=" * 50)


def main():
    parser = argparse.ArgumentParser(description="Jules Task Runner")
    parser.add_argument("--task", "-t", help="Task type to run")
    parser.add_argument("--weekly", action="store_true", help="Run weekly scheduled task")
    parser.add_argument("--list", "-l", action="store_true", help="List available tasks")
    parser.add_argument("--status", "-s", action="store_true", help="Check task status")
    parser.add_argument("--dry-run", action="store_true", help="Print command without running")
    
    args = parser.parse_args()
    
    if args.list:
        list_tasks()
    elif args.status:
        check_status()
    elif args.weekly:
        run_weekly_tasks(args.dry_run)
    elif args.task:
        run_jules_task(args.task, args.dry_run)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
