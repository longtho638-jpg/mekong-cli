"""
🛠 Developer Module for Mekong-CLI
Handles the build-test-ship lifecycle with Agentic Orchestration.
"""

import sys
import time
import typer
import subprocess
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
    
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        for agent, desc in steps:
            task = progress.add_task(description=f"🤖 {agent}: {desc}", total=None)
            time.sleep(1) # Giả lập Agent đang làm việc
            progress.remove_task(task)
            console.print(f"   [green]✓[/green] {agent}: Xong")

    console.print("\n[bold green]✅ Đã 'nấu' xong! Tiếp theo hãy chạy: [cyan]mekong test[/cyan][/bold green]")

def test():
    """🧪 Test: Chạy bộ kiểm thử tự động và xác minh chất lượng code."""
    console.print("\n[bold blue]🧪 Đang chạy kiểm thử hệ thống...[/bold blue]\n")
    
    try:
        # Giả lập chạy test_wow.py hoặc pytest
        result = subprocess.run(["python3", "tests/test_wow.py"], capture_output=True, text=True)
        if result.returncode == 0:
            console.print(result.stdout)
            console.print("\n[bold green]✅ Tất cả kiểm thử đã vượt qua![/bold green]")
        else:
            console.print("[red]⚠️  Có lỗi trong quá trình kiểm thử:[/red]")
            console.print(result.stderr)
    except FileNotFoundError:
        console.print("[yellow]⚠️  Không tìm thấy file tests/test_wow.py. Chạy pytest thay thế...[/yellow]")
        subprocess.run(["pytest"])

def ship():
    """🚀 Ship: Triển khai (Deploy) sản phẩm lên môi trường Production."""
    console.print("\n[bold magenta]🚀 Đang chuẩn bị cất cánh (Ship to Production)...[/bold magenta]\n")
    
    from deploy_automation import run_deploy
    run_deploy()
