import pytest
from sqlalchemy import create_engine, text
from migration_kit.core.engine import MigrationEngine

def test_init_creates_directories_and_table(engine, temp_workspace):
    engine.init()

    assert (temp_workspace / "migrations").exists()
    assert (temp_workspace / "seeds").exists()
    assert (temp_workspace / "migrations" / "__init__.py").exists()

    # Check if table exists
    with engine.adapter.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='_dmk_migrations'"))
        assert result.fetchone() is not None

def test_create_migration_file(engine, temp_workspace):
    engine.init()
    engine.create("create_users")

    files = list((temp_workspace / "migrations").glob("*_create_users.py"))
    assert len(files) == 1

    content = files[0].read_text()
    assert "def up(connection):" in content
    assert "def down(connection):" in content

def test_migrate_and_rollback(engine, temp_workspace):
    engine.init()

    # Create a real migration file
    engine.create("create_test_table")
    files = list((temp_workspace / "migrations").glob("*_create_test_table.py"))
    migration_file = files[0]

    # Write actual SQL logic
    migration_file.write_text("""
from sqlalchemy import text

def up(connection):
    connection.execute(text("CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)"))

def down(connection):
    connection.execute(text("DROP TABLE test_table"))
""")

    # Run migrate
    engine.migrate()

    # Check if table exists and migration is recorded
    with engine.adapter.connect() as conn:
        # Check table
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"))
        assert result.fetchone() is not None

        # Check migration record
        result = conn.execute(text("SELECT * FROM _dmk_migrations"))
        rows = result.fetchall()
        assert len(rows) == 1
        assert "create_test_table" in rows[0][1]

    # Run rollback
    engine.rollback()

    # Check if table is gone and migration record is gone
    with engine.adapter.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'"))
        assert result.fetchone() is None

        result = conn.execute(text("SELECT * FROM _dmk_migrations"))
        assert len(result.fetchall()) == 0

def test_migration_status(engine, capsys, temp_workspace):
    engine.init()
    engine.create("test_status")

    # Check pending status
    engine.status()
    captured = capsys.readouterr()
    assert "Pending" in captured.out

    # Migrate
    engine.migrate()

    # Check applied status
    engine.status()
    captured = capsys.readouterr()
    assert "Applied" in captured.out
