"""
Database Module — ROIaaS Phase 3
"""

from src.db.database import (
    DatabaseConnection,
    get_database,
    init_database,
    close_database,
)
from src.db.schema import SCHEMA_SQL, MIGRATION_001, MIGRATION_002
from src.db.repository import (
    LicenseRepository,
    get_repository,
    init_repository,
)
from src.db.migrate import (
    migrate,
    rollback,
    status,
    MigrationRunner,
)

__all__ = [
    "DatabaseConnection",
    "get_database",
    "init_database",
    "close_database",
    "SCHEMA_SQL",
    "MIGRATION_001",
    "MIGRATION_002",
    "LicenseRepository",
    "get_repository",
    "init_repository",
    "migrate",
    "rollback",
    "status",
    "MigrationRunner",
]
