from datetime import datetime
from pathlib import Path
from typing import Optional
from rich.console import Console

from migration_kit.config import Config
from migration_kit.adapters.base import BaseAdapter
from migration_kit.adapters.impl import get_adapter
from migration_kit.core.registry import MigrationRegistry

console = Console()

class MigrationEngine:
    def __init__(self, config: Config):
        self.config = config
        self.migrations_dir = Path(config.migrations_dir)
        self.registry = MigrationRegistry(self.migrations_dir)

        # Initialize default connection
        db_conf = config.connections[config.default_connection]
        self.adapter = get_adapter(db_conf.driver, db_conf.connection_string)

    def init(self):
        """Initialize the migrations directory and database table."""
        self.migrations_dir.mkdir(parents=True, exist_ok=True)
        Path(self.config.seeds_dir).mkdir(parents=True, exist_ok=True)

        # Create init file
        (self.migrations_dir / "__init__.py").touch()

        with self.adapter.connect() as conn:
            self.adapter.initialize_migrations_table(conn)
            console.print("[green]Initialized database migration kit successfully![/green]")

    def create(self, name: str):
        """Create a new migration file."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        slug = name.lower().replace(" ", "_")
        filename = f"{timestamp}_{slug}.py"
        path = self.migrations_dir / filename

        template = f'''"""
Migration: {name}
Created: {datetime.now().isoformat()}
"""
from sqlalchemy import text

def up(connection):
    """
    Apply migration logic.
    """
    # connection.execute(text("CREATE TABLE example ..."))
    pass

def down(connection):
    """
    Rollback migration logic.
    """
    # connection.execute(text("DROP TABLE example"))
    pass
'''
        path.write_text(template)
        console.print(f"[green]Created migration:[/green] {path}")

    def migrate(self):
        """Apply all pending migrations."""
        with self.adapter.transaction() as conn:
            # Re-verify table exists (just in case)
            self.adapter.initialize_migrations_table(conn)

            applied_ids = self.adapter.get_applied_migrations(conn)
            all_migrations = self.registry.get_migrations()

            pending = [m for m in all_migrations if m.id not in applied_ids]

            if not pending:
                console.print("[yellow]No pending migrations.[/yellow]")
                return

            for migration in pending:
                console.print(f"Applying {migration.id}_{migration.name}...", end=" ")
                try:
                    migration.up(conn)
                    self.adapter.record_migration(conn, migration.id, migration.name)
                    console.print("[green]DONE[/green]")
                except Exception as e:
                    console.print("[red]FAILED[/red]")
                    console.print(f"[red]Error: {e}[/red]")
                    raise

    def rollback(self, steps: int = 1):
        """Rollback the last N migrations."""
        with self.adapter.transaction() as conn:
            applied_ids = self.adapter.get_applied_migrations(conn)
            if not applied_ids:
                console.print("[yellow]No migrations to rollback.[/yellow]")
                return

            # Get migrations to rollback (last N)
            to_rollback_ids = applied_ids[-steps:]
            all_migrations = {m.id: m for m in self.registry.get_migrations()}

            # Rollback in reverse order
            for mig_id in reversed(to_rollback_ids):
                if mig_id not in all_migrations:
                    console.print(f"[red]Migration {mig_id} file not found! Cannot rollback code.[/red]")
                    continue

                migration = all_migrations[mig_id]
                console.print(f"Rolling back {migration.id}_{migration.name}...", end=" ")
                try:
                    migration.down(conn)
                    self.adapter.remove_migration(conn, mig_id)
                    console.print("[green]DONE[/green]")
                except Exception as e:
                    console.print("[red]FAILED[/red]")
                    console.print(f"[red]Error: {e}[/red]")
                    raise

    def status(self):
        """Show migration status."""
        with self.adapter.connect() as conn:
            try:
                # Ensure table exists before checking status
                self.adapter.initialize_migrations_table(conn)
                applied_ids = set(self.adapter.get_applied_migrations(conn))
            except Exception:
                applied_ids = set()

            all_migrations = self.registry.get_migrations()

            console.print(f"{'ID':<16} {'Name':<30} {'Status':<10}")
            console.print("-" * 60)

            for m in all_migrations:
                status = "[green]Applied[/green]" if m.id in applied_ids else "[yellow]Pending[/yellow]"
                console.print(f"{m.id:<16} {m.name:<30} {status}")

    def history(self):
        """Show migration history."""
        with self.adapter.connect() as conn:
            try:
                self.adapter.initialize_migrations_table(conn)
                # We need to fetch applied migrations with timestamp if possible,
                # but our generic adapter just stores ID and Name.
                # Actually GenericSQLAdapter schema has applied_at.
                # Let's fetch that.
                result = conn.execute(text("SELECT id, name, applied_at FROM _dmk_migrations ORDER BY applied_at DESC"))
                rows = result.fetchall()
            except Exception:
                rows = []

            console.print(f"{'Applied At':<20} {'ID':<16} {'Name':<30}")
            console.print("-" * 70)

            for row in rows:
                # row is tuple (id, name, applied_at)
                applied_at = str(row[2])
                console.print(f"{applied_at:<20} {row[0]:<16} {row[1]:<30}")

    def diff(self):
        """Generate a migration based on schema diff (Simple reflection)."""
        if not self.config.model_metadata:
            console.print("[yellow]No 'model_metadata' configured in dmk.toml. Cannot detect diff.[/yellow]")
            return

        from migration_kit.utils import load_symbol
        from sqlalchemy import inspect
        from sqlalchemy.schema import CreateTable

        try:
            metadata = load_symbol(self.config.model_metadata)
        except Exception as e:
            console.print(f"[red]Could not load metadata: {e}[/red]")
            return

        with self.adapter.connect() as conn:
            inspector = inspect(conn)
            db_tables = set(inspector.get_table_names())
            model_tables = set(metadata.tables.keys())

            missing_in_db = model_tables - db_tables
            extra_in_db = db_tables - model_tables

            if not missing_in_db and not extra_in_db:
                console.print("[green]Schema is in sync (table-level checks).[/green]")
                return

            console.print("[bold]Schema Diff Detected:[/bold]")

            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{timestamp}_auto_diff.py"
            path = self.migrations_dir / filename

            up_stmts = []
            down_stmts = []

            for table_name in missing_in_db:
                console.print(f"  [green]+ Table '{table_name}' missing in DB[/green]")
                table = metadata.tables[table_name]
                # Generate CREATE TABLE statement
                stmt = str(CreateTable(table).compile(self.adapter.engine)).strip()
                up_stmts.append(f'    connection.execute(text("""{stmt}"""))')
                down_stmts.append(f'    connection.execute(text("DROP TABLE {table_name}"))')

            for table_name in extra_in_db:
                if table_name == "_dmk_migrations": continue
                console.print(f"  [red]- Table '{table_name}' extra in DB (ignoring for auto-migration safety)[/red]")

            if up_stmts:
                template = f'''"""
Migration: auto_diff
Created: {datetime.now().isoformat()}
"""
from sqlalchemy import text

def up(connection):
{chr(10).join(up_stmts)}

def down(connection):
{chr(10).join(down_stmts)}
'''
                path.write_text(template)
                console.print(f"[green]Created migration:[/green] {path}")
            else:
                console.print("[yellow]No automatic changes generated.[/yellow]")

    def seed(self):
        """Run seed scripts."""
        seeds_dir = Path(self.config.seeds_dir)
        if not seeds_dir.exists():
            console.print("[yellow]Seeds directory not found.[/yellow]")
            return

        import importlib.util

        files = sorted(seeds_dir.glob("*.py"))
        if not files:
            console.print("[yellow]No seed files found.[/yellow]")
            return

        with self.adapter.transaction() as conn:
            for path in files:
                if path.name.startswith("__"):
                    continue

                console.print(f"Running seed {path.name}...", end=" ")
                try:
                    spec = importlib.util.spec_from_file_location(path.stem, path)
                    if not spec or not spec.loader:
                        continue
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    if hasattr(module, 'run'):
                        module.run(conn)
                        console.print("[green]DONE[/green]")
                    else:
                        console.print("[yellow]SKIPPED (no run function)[/yellow]")
                except Exception as e:
                    console.print("[red]FAILED[/red]")
                    console.print(f"[red]Error: {e}[/red]")
                    # Decide if seed failure should rollback everything or just stop
                    raise
