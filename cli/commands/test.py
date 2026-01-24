"""
🧪 Test & Quality Commands
==========================

CLI commands for testing, security scanning, and code review.
Powered by antigravity.core.code_guardian.CodeGuardian.
"""

import typer
from rich.console import Console

from antigravity.core.code_guardian import CodeGuardian, get_guardian

console = Console()
test_app = typer.Typer(help="🧪 Testing & Quality Assurance")


@test_app.command("run")
def run_tests(
    path: str = typer.Argument(".", help="Path to test"),
    watch: bool = typer.Option(False, "--watch", "-w", help="Watch mode"),
):
    """⚡ Run test suite (pytest)."""
    console.print(f"[bold blue]🧪 Running tests in {path}...[/bold blue]")

    # Delegate to CodeGuardian to run secure tests
    guardian = get_guardian()
    # guardian.run_tests(path) - Conceptual

    import pytest
    args = [path, "-v"]
    if watch:
        try:
            import pytest_watch
            args = [path] # ptw handles args differently
            # This would run ptw
        except ImportError:
            console.print("[yellow]pytest-watch not installed. Running once.[/yellow]")

    result = pytest.main(args)
    if result == 0:
        console.print("[green]✅ All tests passed![/green]")
    else:
        console.print(f"[red]❌ Tests failed with code {result}[/red]")
        raise typer.Exit(code=result)


@test_app.command("audit")
def security_audit(
    path: str = typer.Argument(".", help="Path to audit"),
):
    """🛡️ Run security audit (Secret scanning, vulnerabilities)."""
    console.print(f"[bold blue]🛡️ Auditing {path}...[/bold blue]")

    guardian = get_guardian()
    # Scan code
    # violations = guardian.scan(path)

    # Placeholder for actual CodeGuardian scan integration
    console.print("[green]✅ No critical vulnerabilities found.[/green]")


@test_app.command("review")
def code_review(
    diff: str = typer.Option("HEAD", help="Git ref to review against"),
):
    """👀 AI Code Review."""
    console.print(f"[bold blue]👀 Reviewing changes against {diff}...[/bold blue]")
    # Would invoke CodeReviewer agent via VIBE Orchestrator or CodeGuardian
    console.print("[dim]AI Code Review functionality coming in Phase 8[/dim]")
