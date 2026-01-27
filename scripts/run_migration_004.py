import os
import sys

# Add project root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy import text

from backend.db.session import engine


def run_migration():
    print("Connecting to database...")
    try:
        with engine.connect() as connection:
            dialect_name = connection.dialect.name
            print(f"Database dialect: {dialect_name}")

            if dialect_name == 'sqlite':
                print("Detected SQLite. Executing SQLite-compatible schema...")
                statements = [
                    """
                    CREATE TABLE IF NOT EXISTS metrics_snapshots (
                        id TEXT PRIMARY KEY,
                        date DATE NOT NULL,
                        metric_name VARCHAR(100) NOT NULL,
                        metric_value NUMERIC(15, 4) NOT NULL,
                        dimensions TEXT DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        metadata TEXT DEFAULT '{}',
                        UNIQUE(date, metric_name, dimensions)
                    )
                    """,
                    "CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_date ON metrics_snapshots(date DESC)",
                    "CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_name ON metrics_snapshots(metric_name)"
                ]

                for stmt in statements:
                    if stmt.strip():
                        connection.execute(text(stmt))
            else:
                # PostgreSQL
                migration_file = "backend/db/migrations/004_business_metrics.sql"
                print(f"Reading migration file: {migration_file}")
                try:
                    with open(migration_file, "r") as f:
                        sql = f.read()
                    connection.execute(text(sql))
                except FileNotFoundError:
                    print(f"Error: File {migration_file} not found.")
                    return

            connection.commit()
            print("Migration 004_business_metrics.sql executed successfully.")
    except Exception as e:
        print(f"Error executing migration: {e}")

if __name__ == "__main__":
    run_migration()
