"""
Database Migrations

SQL migration files for OAuth2 authentication schema.
"""

import os
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent


def get_migration_sql(filename: str) -> str:
    """Read migration SQL from file."""
    filepath = MIGRATIONS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Migration file not found: {filename}")

    with open(filepath, "r") as f:
        return f.read()


# Migration definitions
MIGRATION_001_USERS = get_migration_sql("001_create_users_table.sql")
MIGRATION_002_ROLES = get_migration_sql("002_add_roles_to_licenses.sql")
MIGRATION_003_SESSIONS = get_migration_sql("003_create_user_sessions.sql")
MIGRATION_004_USER_ROLES = get_migration_sql("004_add_role_to_users.sql")
MIGRATION_005_TIER_CONFIGS = get_migration_sql("005_create_tier_configs.sql")
MIGRATION_006_RATE_LIMIT_EVENTS = get_migration_sql("006_create_rate_limit_events.sql")
MIGRATION_007_LICENSE_ENFORCEMENT = get_migration_sql("007_add_license_enforcement_events.sql")
MIGRATION_008_BILLING_SYSTEM = get_migration_sql("008_billing_system.sql")

__all__ = [
    "MIGRATION_001_USERS",
    "MIGRATION_002_ROLES",
    "MIGRATION_003_SESSIONS",
    "MIGRATION_004_USER_ROLES",
    "MIGRATION_005_TIER_CONFIGS",
    "MIGRATION_006_RATE_LIMIT_EVENTS",
    "MIGRATION_007_LICENSE_ENFORCEMENT",
    "MIGRATION_008_BILLING_SYSTEM",
    "get_migration_sql",
]
