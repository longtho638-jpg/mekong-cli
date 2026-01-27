import pytest
import os
from pathlib import Path
from migration_kit.config import Config, DatabaseConfig
from migration_kit.core.engine import MigrationEngine

@pytest.fixture
def temp_workspace(tmp_path):
    """Create a temporary workspace for testing."""
    cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        yield tmp_path
    finally:
        os.chdir(cwd)

@pytest.fixture
def config(temp_workspace):
    """Create a test configuration."""
    return Config(
        migrations_dir="migrations",
        seeds_dir="seeds",
        default_connection="test_db",
        connections={
            "test_db": DatabaseConfig(
                driver="sqlite",
                database="test.db"
            )
        }
    )

@pytest.fixture
def engine(config):
    """Create a migration engine instance."""
    return MigrationEngine(config)
