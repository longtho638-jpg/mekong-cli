"""
Memory storage and database logic.
"""
import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

class StorageManager:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database with FTS5 for full-text search."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Main observations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS observations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    summary TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # FTS5 virtual table for full-text search
            cursor.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
                    content,
                    summary,
                    content='observations',
                    content_rowid='id'
                )
            """)

            # Trigger to keep FTS5 in sync
            cursor.execute("""
                CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
                    INSERT INTO observations_fts(rowid, content, summary)
                    VALUES (new.id, new.content, new.summary);
                END;
            """)

            conn.commit()
        except sqlite3.Error as e:
            logger.critical(f"Memory DB Init Failed: {e}")
        finally:
            if conn:
                conn.close()

    def get_connection(self):
        return sqlite3.connect(self.db_path)
