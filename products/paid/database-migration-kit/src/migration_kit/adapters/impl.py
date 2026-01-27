from typing import List
from sqlalchemy import text, Connection
from .base import BaseAdapter

class GenericSQLAdapter(BaseAdapter):
    """
    A generic adapter that works for SQLite, PostgreSQL, and MySQL
    using standard SQL for the migrations table.
    """

    def initialize_migrations_table(self, connection: Connection):
        query = """
        CREATE TABLE IF NOT EXISTS _dmk_migrations (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        connection.execute(text(query))

    def get_applied_migrations(self, connection: Connection) -> List[str]:
        query = "SELECT id FROM _dmk_migrations ORDER BY applied_at ASC"
        result = connection.execute(text(query))
        return [row[0] for row in result]

    def record_migration(self, connection: Connection, migration_id: str, name: str):
        query = "INSERT INTO _dmk_migrations (id, name) VALUES (:id, :name)"
        connection.execute(text(query), {"id": migration_id, "name": name})

    def remove_migration(self, connection: Connection, migration_id: str):
        query = "DELETE FROM _dmk_migrations WHERE id = :id"
        connection.execute(text(query), {"id": migration_id})

class SQLiteAdapter(GenericSQLAdapter):
    pass

class PostgresAdapter(GenericSQLAdapter):
    pass

class MySQLAdapter(GenericSQLAdapter):
    pass

def get_adapter(driver: str, connection_string: str) -> BaseAdapter:
    if "sqlite" in driver:
        return SQLiteAdapter(connection_string)
    elif "postgres" in driver:
        return PostgresAdapter(connection_string)
    elif "mysql" in driver:
        return MySQLAdapter(connection_string)
    else:
        raise ValueError(f"Unsupported driver: {driver}")
