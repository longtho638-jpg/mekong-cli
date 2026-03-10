"""
CLI Validators - Input validation and type converters

Centralized validators for CLI command parameters.
"""

import os
from pathlib import Path
from typing import Callable, Optional


def validate_port(value: int) -> int:
    """Validate port number is in valid range."""
    if value < 1 or value > 65535:
        from rich.console import Console
        Console().print(f"[red]Invalid port: {value}. Must be 1-65535[/red]")
        raise ValueError(f"Port must be 1-65535, got {value}")
    return value


def validate_host(value: str) -> str:
    """Validate host address format."""
    import socket
    try:
        socket.inet_aton(value)
        return value
    except socket.error:
        # Allow localhost variations
        if value in ("localhost", "127.0.0.1", "0.0.0.0"):
            return value
        from rich.console import Console
        Console().print(f"[red]Invalid host: {value}[/red]")
        raise ValueError(f"Invalid host address: {value}")


def validate_api_token(token: Optional[str]) -> str:
    """Validate API token is set."""
    if not token:
        from rich.console import Console
        from rich.panel import Panel
        Console().print(
            Panel(
                "[bold red]API token not set![/bold red]\n\n"
                "Set it before running:\n"
                "  [cyan]export MEKONG_API_TOKEN='your-token'[/cyan]",
                title="⚠️ Security Warning",
                border_style="red",
            )
        )
        raise ValueError("API token required")
    return token


def validate_file_exists(path: str) -> Path:
    """Validate file exists."""
    p = Path(path)
    if not p.exists():
        from rich.console import Console
        Console().print(f"[red]File not found: {path}[/red]")
        raise FileNotFoundError(f"File not found: {path}")
    return p


def validate_directory_exists(path: str) -> Path:
    """Validate directory exists."""
    p = Path(path)
    if not p.exists() or not p.is_dir():
        from rich.console import Console
        Console().print(f"[red]Directory not found: {path}[/red]")
        raise NotADirectoryError(f"Directory not found: {path}")
    return p


def validate_recipe_file(path: str) -> Path:
    """Validate recipe file exists and has .md extension."""
    p = validate_file_exists(path)
    if p.suffix != ".md":
        from rich.console import Console
        Console().print(f"[red]Recipe file must be .md, got: {p.suffix}[/red]")
        raise ValueError(f"Recipe file must have .md extension: {path}")
    return p


def validate_complexity(value: str) -> str:
    """Validate task complexity level."""
    valid = ("simple", "moderate", "complex")
    if value.lower() not in valid:
        from rich.console import Console
        Console().print(f"[red]Invalid complexity: {value}. Must be one of: {valid}[/red]")
        raise ValueError(f"Complexity must be {valid}, got {value}")
    return value.lower()


def validate_percentage(value: float) -> float:
    """Validate percentage is 0-100."""
    if value < 0 or value > 100:
        from rich.console import Console
        Console().print(f"[red]Invalid percentage: {value}. Must be 0-100[/red]")
        raise ValueError(f"Percentage must be 0-100, got {value}")
    return value


def create_env_validator(var_name: str, required: bool = True) -> Callable[[], Optional[str]]:
    """Create a validator for environment variable.

    Args:
        var_name: Environment variable name
        required: Whether the variable is required

    Returns:
        Validator function that returns the value or None
    """
    def validate() -> Optional[str]:
        value = os.getenv(var_name)
        if required and not value:
            from rich.console import Console
            from rich.panel import Panel
            Console().print(
                Panel(
                    f"[bold red]{var_name} not set![/bold red]\n\n"
                    f"Set it before running:\n"
                    f"  [cyan]export {var_name}='value'[/cyan]",
                    title="⚠️ Environment Required",
                    border_style="red",
                )
            )
            raise ValueError(f"Environment variable {var_name} required")
        return value
    return validate


# Pre-built validators for common env vars
require_api_token = create_env_validator("MEKONG_API_TOKEN", required=True)
require_llm_url = create_env_validator("LLM_BASE_URL", required=False)
require_anthropic_key = create_env_validator("ANTHROPIC_API_KEY", required=False)
require_openai_key = create_env_validator("OPENAI_API_KEY", required=False)
