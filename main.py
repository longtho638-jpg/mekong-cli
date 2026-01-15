#!/usr/bin/env python3
"""
🌊 MEKONG-CLI: The Agency OS Command Line Interface
===================================================

"Deploy Your Agency in 15 Minutes."
Powered by Hybrid Agentic Architecture 2026.

Primary Commands:
- 🏗️ init: Bootstrap a new agency project.
- 🎤 setup-vibe: Localize AI voice and regional tone.
- 🔌 mcp-setup: Initialize Model Context Protocol servers.
- ➕ mcp-install: Install new MCP servers (Supabase, Postgres, etc.)
- 🚀 deploy: Production deployment to Cloud Run.
- 🔐 activate: License lifecycle management.

Binh Pháp: ⚡ Quân Tranh (Speed) - Rapid deployment and execution.
"""

import sys
import typer
from rich.console import Console
from core.constants import APP_NAME

# --- CLI Initialization ---

# Typer provides a robust, type-safe CLI experience
app = typer.Typer(
    help=f"{APP_NAME}: The One-Person Unicorn Operating System",
    no_args_is_help=True,
    add_completion=False,
    rich_markup_mode="rich"
)
console = Console()

# --- Command Registry (Lazy Loaded for Performance) ---

@app.command(name="init")
def init_cmd(name: str = typer.Argument(..., help="Tên của dự án/agency mới")):
    """🏗️ Khởi tạo dự án Agency OS mới."""
    from cli.project import init
    init(name)

@app.command(name="deploy")
def deploy_cmd():
    """🚀 Triển khai hệ thống lên Cloud Run (Production)."""
    from cli.project import deploy_cmd
    deploy_cmd()

@app.command(name="setup-vibe")
def setup_vibe_cmd(
    niche: str = typer.Option(None, "--niche", "-n", help="Lĩnh vực kinh doanh mục tiêu"),
    location: str = typer.Option(..., prompt="📍 Vị trí (VD: Cần Thơ, Hà Nội)", help="Địa phương hoạt động"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="🎤 Giọng thương hiệu", help="Phong cách giao tiếp")
):
    """🎤 Tùy chỉnh 'linh hồn' AI (Voice & Tone) theo vùng miền."""
    from cli.config import setup_vibe
    setup_vibe(niche, location, tone)

@app.command(name="generate-secrets")
def generate_secrets_cmd():
    """🔐 Khởi tạo file .env bảo mật (Chứa API Keys)."""
    from cli.config import generate_secrets
    generate_secrets()

@app.command(name="mcp-setup")
def mcp_setup_cmd():
    """🔌 Thiết lập kết nối MCP (Model Context Protocol)."""
    from cli.config import setup_mcp
    setup_mcp()

@app.command(name="mcp-install")
def mcp_install_cmd(
    url_or_name: str = typer.Argument(..., help="URL GitHub hoặc tên (vd: supabase)")
):
    """➕ Cài đặt thêm MCP Server mới."""
    from cli.config import install_mcp
    install_mcp(url_or_name)

@app.command(name="vibes")
def vibes_cmd_wrapper():
    """📚 Xem danh sách các phong cách (Vibes) vùng miền có sẵn."""
    from cli.config import vibes_cmd
    vibes_cmd()

@app.command(name="run-scout")
def run_scout_cmd(feature: str = typer.Argument(..., help="Tính năng cần nghiên cứu")):
    """🔍 Kích hoạt Agent Scout để nghiên cứu thị trường/codebase."""
    from cli.agents import run_scout_cmd
    run_scout_cmd(feature)

@app.command(name="agents")
def agents_cmd_wrapper():
    """🤖 Hiển thị danh sách các AI Agents đang online."""
    from cli.agents import agents_cmd
    agents_cmd()

@app.command(name="activate")
def activate_cmd(key: str = typer.Argument(..., help="Mã kích hoạt bản quyền")):
    """🔑 Kích hoạt bản quyền Mekong-CLI (Starter/Pro/Enterprise)."""
    from cli.billing import activate_cmd
    activate_cmd(key)

@app.command(name="status")
def status_cmd():
    """📊 Kiểm tra tình trạng bản quyền và hạn mức sử dụng."""
    from cli.billing import status_cmd
    status_cmd()

@app.command(name="costs")
def costs_cmd():
    """💰 Dự toán chi phí vận hành AI (Hybrid Router optimization)."""
    from cli.billing import costs_cmd
    costs_cmd()

# --- Entry Point ---

if __name__ == "__main__":
    try:
        app()
    except Exception as e:
        console.print(f"\n[bold red]❌ Lỗi thực thi:[/bold red] {e}")
        sys.exit(1)
