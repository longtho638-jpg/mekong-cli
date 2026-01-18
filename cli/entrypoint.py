"""
🌊 MEKONG-CLI: The Unified Agency OS Command Center
===================================================
Entry point module for the CLI application.
"""

import sys

import typer
from rich.console import Console

from core.constants import APP_NAME

# Initialize Console
console = Console()

# --- CLI Initialization ---
app = typer.Typer(
    help=f"🏯 {APP_NAME}: The One-Person Unicorn Operating System",
    no_args_is_help=True,
    add_completion=False,
    rich_markup_mode="rich",
)

# Sub-apps
strategy_app = typer.Typer(help="🏯 Chiến lược Binh Pháp & Lập kế hoạch")
dev_app = typer.Typer(help="🛠 Quy trình phát triển (Cook-Test-Ship)")
mcp_app = typer.Typer(help="🔌 Quản lý Model Context Protocol (MCP)")
revenue_app = typer.Typer(help="💰 Quản lý Doanh thu & Autopilot")
outreach_app = typer.Typer(help="📧 Quản lý Lead & Outreach")
content_app = typer.Typer(help="✍️ Tạo nội dung Marketing")
finance_app = typer.Typer(help="💰 Quản lý Tài chính")
sales_app = typer.Typer(help="💼 Quản lý Sales & Sản phẩm")
ops_app = typer.Typer(help="👁️ Operations & Monitoring")
setup_app = typer.Typer(help="⚙️ Setup & Configuration")
bridge_app = typer.Typer(help="🌉 Bridge Sync: Claude <-> AgencyOS")

app.add_typer(strategy_app, name="strategy")
app.add_typer(dev_app, name="dev")
app.add_typer(mcp_app, name="mcp")
app.add_typer(revenue_app, name="revenue")

from cli.commands.bridge import bridge_app
from cli.commands.content import content_app
from cli.commands.finance import finance_app
from cli.commands.ops import ops_app
from cli.commands.outreach import outreach_app
from cli.commands.sales import sales_app
from cli.commands.setup import setup_app

app.add_typer(outreach_app, name="outreach")
app.add_typer(content_app, name="content")
app.add_typer(finance_app, name="finance")
app.add_typer(sales_app, name="sales")
app.add_typer(ops_app, name="ops")
app.add_typer(setup_app, name="setup")
app.add_typer(bridge_app, name="bridge")


def print_banner():
    """Prints the application banner."""
    banner = """
[bold primary]╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌊 MEKONG-CLI & 🏯 AGENCY OS                            ║
║                                                           ║
║   The One-Person Unicorn Operating System                ║
║   "Không đánh mà thắng" - Win Without Fighting           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝[/bold primary]
    """
    console.print(banner)


# --- Top Level Commands ---


@app.command(name="dashboard")
def dashboard_cmd():
    """📊 Xem Master Dashboard (Doanh thu, Leads, KPI)."""
    from cli.commands.dashboard import show_dashboard

    show_dashboard()


@app.command(name="init")
def init_cmd(name: str = typer.Argument(..., help="Tên của dự án/agency mới")):
    """🏗️ Khởi tạo dự án Agency OS mới từ template."""
    from cli.project import init

    init(name)


@app.command(name="activate")
def activate_cmd(
    key: str = typer.Option(
        ..., "--key", "-k", prompt="Mã kích hoạt", help="Mã kích hoạt bản quyền"
    ),
):
    """🔑 Kích hoạt bản quyền (Starter/Pro/Enterprise)."""
    from cli.billing import activate_cmd

    activate_cmd(key)


@app.command(name="status")
def status_cmd():
    """📊 Kiểm tra tình trạng bản quyền và hạn mức sử dụng."""
    from cli.billing import status_cmd

    status_cmd()


@app.command(name="setup-vibe")
def setup_vibe_cmd(
    location: str = typer.Option(
        ..., prompt="📍 Vị trí (VD: Cần Thơ, Hà Nội)", help="Địa phương hoạt động"
    ),
    tone: str = typer.Option(
        "Bình dân, Chân thành", prompt="🎤 Giọng thương hiệu", help="Phong cách giao tiếp"
    ),
):
    """🎤 Tùy chỉnh 'linh hồn' AI (Voice & Tone) theo vùng miền."""
    from cli.commands.vibe import setup_vibe

    setup_vibe(None, location, tone)


# --- Strategy Sub-commands ---


@strategy_app.command(name="analyze")
def strategy_analyze(idea: str = typer.Argument(..., help="Ý tưởng cần phân tích")):
    """🏯 Phân tích chiến lược dự án theo Binh Pháp."""
    from cli.strategy import analyze

    analyze(idea)


@strategy_app.command(name="plan")
def strategy_plan(task: str = typer.Argument(..., help="Nhiệm vụ cần lập kế hoạch")):
    """📋 Tạo Task Plan (kế hoạch tác chiến)."""
    from cli.strategy import plan

    plan(task)


@strategy_app.command(name="win3")
def strategy_win3():
    """⚖️  Kiểm tra cân bằng WIN-WIN-WIN."""
    from cli.strategy import win3

    win3()


# --- Dev Sub-commands ---


@app.command(name="cook")
def cook_cmd(feature: str = typer.Argument(..., help="Tính năng cần xây dựng")):
    """🍳 Build: Kích hoạt Agent để xây dựng tính năng."""
    from cli.developer import cook

    cook(feature)


@app.command(name="test")
def test_cmd():
    """🧪 Test: Chạy bộ kiểm thử tự động."""
    from cli.developer import test

    test()


@app.command(name="ship")
def ship_cmd():
    """🚀 Ship: Triển khai sản phẩm lên Production."""
    from cli.developer import ship

    ship()


# --- MCP Sub-commands ---


@mcp_app.command(name="setup")
def mcp_setup():
    """🔌 Thiết lập kết nối MCP ban đầu."""
    from cli.commands.mcp import setup_mcp

    setup_mcp()


@mcp_app.command(name="install")
def mcp_install(package: str = typer.Argument(..., help="Tên package hoặc URL GitHub")):
    """➕ Cài đặt thêm MCP Server mới."""
    from cli.commands.mcp import install_mcp

    install_mcp(package)


# --- Revenue Sub-commands ---


@revenue_app.command(name="autopilot")
def revenue_autopilot():
    """🚀 Chạy Revenue Autopilot (Content, Outreach, Metrics)."""
    from cli.commands.revenue import run_autopilot

    run_autopilot()


@revenue_app.command(name="report")
def revenue_report():
    """📈 Xem báo cáo doanh thu mới nhất."""
    from cli.commands.revenue import show_report

    show_report()


# --- Utility Commands ---


@app.command(name="agents")
def agents_list():
    """🤖 Danh sách AI Agents đang online."""
    from cli.agents import agents_cmd

    agents_cmd()


@app.command(name="scaffold")
def scaffold_cmd(request: str = typer.Argument(..., help="Yêu cầu kiến trúc")):
    """🏗️ Scaffold: Tạo bản vẽ kiến trúc dự án (Architect Agent)."""
    try:
        from core.modules.architect import ArchitectPresenter, ArchitectService

        service = ArchitectService()
        profile = service.analyze_request(request)
        blueprint = service.generate_blueprint(profile)
        console.print(ArchitectPresenter.display_blueprint(profile, blueprint))
    except ImportError:
        console.print("[red]❌ Architect module not found.[/red]")


def main():
    """Entry point for the CLI."""
    if len(sys.argv) == 1:
        print_banner()
    try:
        app()
    except Exception as e:
        console.print(f"\n[bold red]❌ Lỗi thực thi:[/bold red] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
