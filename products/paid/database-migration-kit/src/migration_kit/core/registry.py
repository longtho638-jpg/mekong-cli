import importlib.util
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Callable
from pydantic import BaseModel

class Migration(BaseModel):
    id: str
    name: str
    path: Path
    up: Callable
    down: Callable
    timestamp: datetime

class MigrationRegistry:
    def __init__(self, migrations_dir: Path):
        self.migrations_dir = migrations_dir

    def get_migrations(self) -> List[Migration]:
        if not self.migrations_dir.exists():
            return []

        migrations = []
        # Expect files like 20230101120000_name.py
        for path in sorted(self.migrations_dir.glob("*.py")):
            if path.name.startswith("__"):
                continue

            spec = importlib.util.spec_from_file_location(path.stem, path)
            if not spec or not spec.loader:
                continue

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, 'up') or not hasattr(module, 'down'):
                continue

            # Extract ID from filename (timestamp)
            parts = path.stem.split('_', 1)
            migration_id = parts[0]
            name = parts[1] if len(parts) > 1 else "unknown"

            migrations.append(Migration(
                id=migration_id,
                name=name,
                path=path,
                up=module.up,
                down=module.down,
                timestamp=datetime.strptime(migration_id, "%Y%m%d%H%M%S")
            ))

        return migrations
