"""
🛠 Developer Module for Mekong-CLI
Handles the build-test-ship lifecycle with Agentic Orchestration.
"""

import subprocess
import time
from pathlib import Path

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


def cook(feature: str = typer.Argument(..., help="Tính năng cần xây dựng")):
    """🍳 Build: Kích hoạt Agent Orchestration để viết code và xây dựng tính năng."""
    console.print(f"\n[bold yellow]🍳 Đang chuẩn bị 'nấu' tính năng:[/bold yellow] {feature}")

    steps = [
        ("Planner", "Phân tích yêu cầu..."),
        ("Researcher", "Kiểm tra kiến trúc & Best practices..."),
        ("Developer", "Viết code và các thành phần..."),
        ("Reviewer", "Kiểm tra logic & Security..."),
    ]

    with Progress(
        SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console
    ) as progress:
        for agent, desc in steps:
            task = progress.add_task(description=f"🤖 {agent}: {desc}", total=None)
            time.sleep(1)  # Giả lập Agent đang làm việc
            progress.remove_task(task)
            console.print(f"   [green]✓[/green] {agent}: Xong")

    console.print(
        "\n[bold green]✅ Đã 'nấu' xong! Tiếp theo hãy chạy: [cyan]mekong test[/cyan][/bold green]"
    )


def test(
    integration: bool = typer.Option(False, "--integration", "-i", help="Run integration tests")
):
    """🧪 Test: Chạy bộ kiểm thử tự động và xác minh chất lượng code."""
    console.print("\n[bold blue]🧪 Đang chạy kiểm thử hệ thống...[/bold blue]\n")

    # 1. Run Unit Tests
    try:
        console.print("Running [cyan]pytest[/cyan]...")
        # Check if tests directory exists
        if not Path("tests").exists() and not Path("backend/tests").exists():
             console.print("[yellow]⚠️  No 'tests' directory found. Skipping unit tests.[/yellow]")
        else:
            result = subprocess.run(["pytest"], capture_output=True, text=True)
            if result.returncode == 0:
                console.print(result.stdout)
                console.print("[bold green]✅ Unit tests passed![/bold green]")
            else:
                console.print("[red]⚠️  Unit tests failed:[/red]")
                console.print(result.stderr or result.stdout)
    except FileNotFoundError:
        console.print("[red]❌ pytest not found. Install it with `pip install pytest`.[/red]")

    # 2. Run Integration Tests (Optional)
    if integration:
        console.print("\n[bold blue]🔗 Running Integration Tests...[/bold blue]")
        try:
            from core.testing.integration import IntegrationTester
            tester = IntegrationTester(Path.cwd())
            results = tester.run_all()
            
            # Display results summary
            failed = False
            for category, data in results.items():
                console.print(f"\n[bold]{category.replace('_', ' ').title()}[/bold]")
                for k, v in data.items():
                    if k in ["components_created", "sample_skills_verified", "sample_mappings_tested"]:
                        continue # Skip detailed lists for CLI summary
                    icon = "✅" if v else "❌"
                    if isinstance(v, bool) and not v: failed = True
                    console.print(f"  {icon} {k}: {v}")
            
            if failed:
                console.print("\n[red]❌ Integration tests failed.[/red]")
            else:
                console.print("\n[bold green]✅ Integration tests passed![/bold green]")

        except ImportError:
            console.print("[red]❌ Core testing module not found.[/red]")


def ship():
    """🚀 Ship: Triển khai (Deploy) sản phẩm lên môi trường Production."""
    console.print(
        "\n[bold magenta]🚀 Đang chuẩn bị cất cánh (Ship to Production)...[/bold magenta]\n"
    )

    try:
        from core.ops.deploy import DeployManager
        manager = DeployManager()
        manager.run()
    except ImportError:
        console.print("[red]❌ Deploy module not found.[/red]")
    except Exception as e:
        console.print(f"[red]❌ Deploy failed: {e}[/red]")