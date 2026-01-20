"""
VIBE Commands for AntigravityKit.

Contains VIBE IDE workflow commands.
"""


def cmd_vibe_code(plan_path: str = None):
    """Run VIBE 6-step development workflow."""
    from antigravity.core.vibe_workflow import VIBEWorkflow

    print("\n VIBE CODE - 6-Step Development Workflow")
    print("-" * 50)

    workflow = VIBEWorkflow()

    # Step 0: Plan Detection
    plan = workflow.detect_plan(plan_path)
    if plan:
        print(f" Step 0: Plan detected - {plan}")
    else:
        print(" No plan found. Create one with: vibe:plan")
        return

    # Step 1: Analysis
    tasks = workflow.analyze_plan()
    print(f" Step 1: Found {len(tasks)} tasks")

    workflow.print_status()
    print("\n Run /code in your IDE to continue the workflow")


def cmd_vibe_plan(title: str = "New Feature"):
    """Create a new implementation plan."""
    from antigravity.core.vibe_ide import VIBEIDE

    print("\n VIBE PLAN - Create Implementation Plan")
    print("-" * 50)

    ide = VIBEIDE()

    description = input("   Description []: ").strip() or f"Implementation plan for {title}"
    priority = input("   Priority [P2]: ").strip() or "P2"

    plan_file = ide.create_plan(title=title, description=description, priority=priority)

    print(f"\n Plan created: {plan_file}")
    print("   Next: Edit the plan and run vibe:code")


def cmd_vibe_status():
    """Show VIBE IDE dashboard."""
    from antigravity.core.vibe_ide import VIBEIDE
    from antigravity.core.vibe_orchestrator import VIBEOrchestrator

    ide = VIBEIDE()
    orchestrator = VIBEOrchestrator()

    ide.print_dashboard()
    orchestrator.print_status()
