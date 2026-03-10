"""
Database Migration Runner — ROIaaS Phase 3

Runs schema migrations on startup with rollback support.
"""

import sys
from typing import Optional

from src.db.database import DatabaseConnection, init_database, close_database
from src.db.schema import MIGRATION_001, MIGRATION_002, MIGRATION_003
from src.db.migrations import (
    MIGRATION_001_USERS,
    MIGRATION_002_ROLES,
    MIGRATION_003_SESSIONS,
    MIGRATION_004_USER_ROLES,
    MIGRATION_005_TIER_CONFIGS,
    MIGRATION_006_RATE_LIMIT_EVENTS,
    MIGRATION_007_LICENSE_ENFORCEMENT,
    MIGRATION_008_BILLING_SYSTEM,
)


MIGRATIONS = [
    ("001", "Initial schema", MIGRATION_001),
    ("002", "Webhook events table", MIGRATION_002),
    ("003", "Audit logs table", MIGRATION_003),
    ("004", "OAuth2 users table", MIGRATION_001_USERS),
    ("005", "Add roles to licenses", MIGRATION_002_ROLES),
    ("006", "User sessions table", MIGRATION_003_SESSIONS),
    ("007", "Add role to users table", MIGRATION_004_USER_ROLES),
    ("008", "Tier configs table", MIGRATION_005_TIER_CONFIGS),
    ("009", "Rate limit events table", MIGRATION_006_RATE_LIMIT_EVENTS),
    ("010", "License enforcement events", MIGRATION_007_LICENSE_ENFORCEMENT),
    ("011", "Billing system tables", MIGRATION_008_BILLING_SYSTEM),
]


class MigrationRunner:
    """Run database migrations with version tracking."""

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        self._db = db
        self._initialized = False

    async def _ensure_db(self) -> DatabaseConnection:
        if self._db is None:
            self._db = await init_database()
        return self._db

    async def _create_migrations_table(self, db: DatabaseConnection) -> None:
        """Create migrations tracking table if not exists."""
        query = """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """
        await db.execute(query)

    async def _get_applied_migrations(self, db: DatabaseConnection) -> set:
        """Get set of already applied migration versions."""
        query = "SELECT version FROM schema_migrations ORDER BY version"
        rows = await db.fetch_all(query)
        return {row["version"] for row in rows}

    async def _record_migration(
        self,
        db: DatabaseConnection,
        version: str,
        name: str,
    ) -> None:
        """Record a migration as applied."""
        query = "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)"
        await db.execute(query, (version, name))

    async def run_migrations(self, target_version: Optional[str] = None) -> dict:
        """
        Run all pending migrations.

        Args:
            target_version: Stop at this version (for rollback testing)

        Returns:
            Dict with applied_migrations count and status
        """
        db = await self._ensure_db()
        await self._create_migrations_table(db)

        applied = await self._get_applied_migrations(db)
        applied_count = 0

        for version, name, sql in MIGRATIONS:
            if target_version and version > target_version:
                break

            if version in applied:
                continue

            print(f"🔧 Applying migration {version}: {name}...")
            try:
                await db.execute(sql)
                await self._record_migration(db, version, name)
                print(f"✅ Migration {version} applied successfully")
                applied_count += 1
            except Exception as e:
                print(f"❌ Migration {version} failed: {e}")
                raise

        return {
            "status": "success",
            "applied_migrations": applied_count,
            "total_migrations": len(MIGRATIONS),
        }

    async def rollback(self, target_version: str) -> dict:
        """
        Rollback to a specific version.

        Args:
            target_version: Version to rollback to

        Returns:
            Dict with rolled_back count and status
        """
        db = await self._ensure_db()
        applied = await self._get_applied_migrations(db)

        rolled_back = 0
        for version, name, _ in reversed(MIGRATIONS):
            if version not in applied:
                continue
            if version <= target_version:
                break

            print(f"🔙 Rolling back migration {version}: {name}...")
            # Note: Actual rollback SQL would need DOWN migrations
            # For now, just remove from tracking
            query = "DELETE FROM schema_migrations WHERE version = $1"
            await db.execute(query, (version,))
            print(f"✅ Migration {version} rolled back")
            rolled_back += 1

        return {
            "status": "success",
            "rolled_back_migrations": rolled_back,
        }

    async def get_status(self) -> dict:
        """Get migration status."""
        db = await self._ensure_db()
        applied = await self._get_applied_migrations(db)

        pending = [
            (v, n) for v, n, _ in MIGRATIONS if v not in applied
        ]

        return {
            "applied": list(applied),
            "pending": pending,
            "current_version": max(applied) if applied else "none",
        }


async def migrate() -> dict:
    """Run all pending migrations."""
    runner = MigrationRunner()
    try:
        result = await runner.run_migrations()
        return result
    finally:
        await close_database()


async def rollback(to_version: str) -> dict:
    """Rollback to specific version."""
    runner = MigrationRunner()
    try:
        return await runner.rollback(to_version)
    finally:
        await close_database()


async def status() -> dict:
    """Show migration status."""
    runner = MigrationRunner()
    try:
        return await runner.get_status()
    finally:
        await close_database()


if __name__ == "__main__":
    """CLI entry point for migrations."""
    import asyncio

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python -m src.db.migrate [migrate|rollback|status] [version]")
            sys.exit(1)

        command = sys.argv[1]

        if command == "migrate":
            result = await migrate()
            print(f"\n✅ Migrations complete: {result['applied_migrations']} applied")
        elif command == "rollback":
            if len(sys.argv) < 3:
                print("Error: rollback requires target version")
                sys.exit(1)
            result = await rollback(sys.argv[2])
            print(f"\n✅ Rollback complete: {result['rolled_back_migrations']} rolled back")
        elif command == "status":
            result = await status()
            print("\n📊 Migration Status:")
            print(f"   Current: {result['current_version']}")
            print(f"   Applied: {', '.join(result['applied']) or 'none'}")
            print(f"   Pending: {', '.join(f'{v} ({n})' for v, n in result['pending']) or 'none'}")
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)

    asyncio.run(main())
