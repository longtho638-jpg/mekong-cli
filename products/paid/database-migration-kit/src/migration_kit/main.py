import typer
from pathlib import Path
from migration_kit.config import load_config
from migration_kit.core.engine import MigrationEngine
from rich.console import Console

app = typer.Typer(help="Database Migration Kit CLI")
console = Console()

def get_engine():
    config = load_config()
    return MigrationEngine(config)

@app.command()
def init():
    """Initialize DMK in the current project."""
    # Create default config if it doesn't exist
    config_path = Path("dmk.toml")
    if not config_path.exists():
        content = """
[migrations]
dir = "migrations"

[connections.default]
driver = "sqlite"
database = "db.sqlite"
"""
        with open(config_path, "w") as f:
            f.write(content)
        console.print("[green]Created dmk.toml[/green]")

    engine = get_engine()
    engine.init()

@app.command()
def create(name: str):
    """Create a new migration."""
    engine = get_engine()
    engine.create(name)

@app.command()
def migrate():
    """Apply all pending migrations."""
    engine = get_engine()
    engine.migrate()

@app.command()
def rollback(steps: int = 1):
    """Rollback the last migration."""
    engine = get_engine()
    engine.rollback(steps)

@app.command()
def status():
    """Show migration status."""
    engine = get_engine()
    engine.status()

@app.command()
def history():
    """Show migration history."""
    engine = get_engine()
    engine.history()

@app.command()
def seed():
    """Run database seeders."""
    engine = get_engine()
    engine.seed()

@app.command()
def diff():
    """Generate migration from schema diff."""
    engine = get_engine()
    engine.diff()

if __name__ == "__main__":
    app()
