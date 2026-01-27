from abc import ABC, abstractmethod
from typing import List, Any, Dict, Optional
from sqlalchemy import create_engine, text, Engine, Connection
from contextlib import contextmanager

class BaseAdapter(ABC):
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)

    @contextmanager
    def transaction(self):
        """Provide a transactional scope."""
        connection = self.engine.connect()
        trans = connection.begin()
        try:
            yield connection
            trans.commit()
        except Exception:
            trans.rollback()
            raise
        finally:
            connection.close()

    @contextmanager
    def connect(self):
        """Provide a raw connection."""
        connection = self.engine.connect()
        try:
            yield connection
        finally:
            connection.close()

    @abstractmethod
    def initialize_migrations_table(self, connection: Connection):
        """Create the migrations tracking table if it doesn't exist."""
        pass

    @abstractmethod
    def get_applied_migrations(self, connection: Connection) -> List[str]:
        """Get list of applied migration IDs."""
        pass

    @abstractmethod
    def record_migration(self, connection: Connection, migration_id: str, name: str):
        """Record a successful migration."""
        pass

    @abstractmethod
    def remove_migration(self, connection: Connection, migration_id: str):
        """Remove a migration record (rollback)."""
        pass

    def execute_script(self, connection: Connection, script: str):
        """Execute a raw SQL script."""
        # Split by semicolon for basic script execution if needed,
        # but sqlalchemy.text handles specific statements best.
        # For complex scripts, might need better parsing.
        # For now, executing as whole block or statement by statement if list provided.
        connection.execute(text(script))
