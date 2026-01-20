"""
Utility Commands for MEKONG-CLI.

Contains miscellaneous utility commands (agents, scaffold, dashboard, etc.).
"""

import typer

from rich.console import Console

console = Console()


def register_utility_commands(app: typer.Typer) -> None:
    """Register utility commands to the main app.

    Args:
        app: The main Typer app to register commands to.
    """

    @app.command(name="dashboard")
    def dashboard_cmd():
        """Xem Master Dashboard (Doanh thu, Leads, KPI)."""
        from cli.commands.dashboard import show_dashboard

        show_dashboard()

    @app.command(name="init")
    def init_cmd(name: str = typer.Argument(..., help="Ten cua du an/agency moi")):
        """Khoi tao du an Agency OS moi tu template."""
        from cli.project import init

        init(name)

    @app.command(name="activate")
    def activate_cmd(
        key: str = typer.Option(
            ..., "--key", "-k", prompt="Ma kich hoat", help="Ma kich hoat ban quyen"
        ),
    ):
        """Kich hoat ban quyen (Starter/Pro/Enterprise)."""
        from cli.billing import activate_cmd as _activate

        _activate(key)

    @app.command(name="status")
    def status_cmd():
        """Kiem tra tinh trang ban quyen va han muc su dung."""
        from cli.billing import status_cmd as _status

        _status()

    @app.command(name="setup-vibe")
    def setup_vibe_cmd(
        location: str = typer.Option(
            ..., prompt="Vi tri (VD: Can Tho, Ha Noi)", help="Dia phuong hoat dong"
        ),
        tone: str = typer.Option(
            "Binh dan, Chan thanh", prompt="Giong thuong hieu", help="Phong cach giao tiep"
        ),
    ):
        """Tuy chinh 'linh hon' AI (Voice & Tone) theo vung mien."""
        from cli.commands.vibe import setup_vibe

        setup_vibe(None, location, tone)

    @app.command(name="agents")
    def agents_list():
        """Danh sach AI Agents dang online."""
        from cli.agents import agents_cmd

        agents_cmd()

    @app.command(name="scaffold")
    def scaffold_cmd(request: str = typer.Argument(..., help="Yeu cau kien truc")):
        """Scaffold: Tao ban ve kien truc du an (Architect Agent)."""
        try:
            from core.modules.architect import ArchitectPresenter, ArchitectService

            service = ArchitectService()
            profile = service.analyze_request(request)
            blueprint = service.generate_blueprint(profile)
            console.print(ArchitectPresenter.display_blueprint(profile, blueprint))
        except ImportError:
            console.print("[red]Architect module not found.[/red]")
