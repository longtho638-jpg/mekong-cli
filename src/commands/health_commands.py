"""Health endpoint CLI command.

Extracted from main.py for file size compliance (DIEU 3: < 200 lines).
"""

import typer
from rich.console import Console

console = Console()
app = typer.Typer()


@app.command()
def health(
    port: int = typer.Option(9192, "--port", "-p", help="Health endpoint port"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host to bind"),
    no_browser: bool = typer.Option(False, "--no-browser", "-n", help="Don't open browser"),
) -> None:
    """Start health endpoint server (manual mode)."""
    import time
    from src.core.health_endpoint import (
        get_health_url,
        start_health_server,
        register_component_check,
    )
    from src.core.crash_detector import get_crash_detector

    def check_license() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            from src.lib.raas_gate_validator import RaasGateValidator
            validator = RaasGateValidator()
            is_valid, _ = validator.validate()
            return ComponentStatus(
                status="healthy" if is_valid else "degraded",
                message="License valid" if is_valid else "License invalid/expired",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_usage() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            return ComponentStatus(status="healthy", message="Usage tracking ready")
        except Exception as e:
            return ComponentStatus(status="degraded", message=str(e))

    def check_crash_detector() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            detector = get_crash_detector()
            freq = detector.get_frequency()
            if freq.crashes_per_hour > 10:
                return ComponentStatus(
                    status="degraded",
                    message=f"High crash rate: {freq.crashes_per_hour:.1f}/hour",
                )
            return ComponentStatus(
                status="healthy",
                message=f"{freq.crashes_last_hour} crashes in last hour",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_telegram() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            import os
            if os.getenv("TELEGRAM_BOT_TOKEN"):
                return ComponentStatus(status="healthy", message="Telegram configured")
            return ComponentStatus(status="degraded", message="Telegram not configured")
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_proxy() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            import os
            proxy_url = os.getenv("LLM_BASE_URL", os.getenv("ANTHROPIC_BASE_URL", ""))
            return ComponentStatus(
                status="healthy",
                message=f"Proxy at {proxy_url}",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    register_component_check("license", check_license)
    register_component_check("usage", check_usage)
    register_component_check("crash_detector", check_crash_detector)
    register_component_check("telegram", check_telegram)
    register_component_check("proxy", check_proxy)

    console.print("[bold cyan]Health Endpoint[/bold cyan]")
    console.print(f"[dim]Starting server at {get_health_url(host, port)}[/dim]")
    console.print(f"[dim]Dashboard: {get_health_url(host, port).replace('/health', '/docs')}[/dim]")
    console.print()
    console.print("[dim]Press Ctrl+C to stop[/dim]\n")

    start_health_server(host=host, port=port)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        from src.core.health_endpoint import stop_health_server
        stop_health_server()
        console.print("\n[yellow]Health endpoint stopped[/yellow]")
