"""
AgencyOS Memory System
Based on claude-mem architecture with progressive disclosure.

Storage: SQLite for persistence
Pattern: 3-layer workflow (search → timeline → get_observations)
"""

import json
import logging
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@dataclass
class Observation:
    """A memory observation."""

    id: Optional[int] = None
    session_id: str = ""
    type: str = "note"  # 'code', 'error', 'decision', 'note'
    content: str = ""
    summary: str = ""
    created_at: str = ""


class Memory:
    """
    AgencyOS Memory System.

    Persists contextual observations using SQLite with Full-Text Search (FTS5).
    """

    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            # Default: ~/.agencyos/memory/sessions.db
            memory_dir = Path.home() / ".agencyos" / "memory"
            try:
                memory_dir.mkdir(parents=True, exist_ok=True)
            except OSError as e:
                logger.error(f"Failed to create memory directory: {e}")

            db_path = memory_dir / "sessions.db"

        self.db_path = db_path
        self._init_db()
        logger.info(f"Memory system initialized at {db_path}")

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

    def add_observation(
        self,
        content: str,
        obs_type: str = "note",
        session_id: str = "default",
        summary: Optional[str] = None,
    ) -> int:
        """Add a new memory observation."""
        if not content:
            raise ValueError("Observation content cannot be empty")

        if summary is None:
            # Auto-summarize (simple truncate for now)
            summary = content[:100] + "..." if len(content) > 100 else content

        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO observations (session_id, type, content, summary)
                VALUES (?, ?, ?, ?)
            """,
                (session_id, obs_type, content, summary),
            )

            obs_id = cursor.lastrowid
            conn.commit()
            logger.debug(f"Added observation {obs_id} ({obs_type})")
            return obs_id if obs_id is not None else -1
        except sqlite3.Error as e:
            logger.error(f"Failed to add observation: {e}")
            return -1
        finally:
            if conn:
                conn.close()

    def search_memory(
        self, query: str, limit: int = 10, obs_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Search memory using FTS5 full-text search.
        Returns compact index (~50-100 tokens/result).
        """
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Build query
            sql = """
                SELECT o.id, o.type, o.summary, o.created_at
                FROM observations o
                JOIN observations_fts fts ON o.id = fts.rowid
                WHERE observations_fts MATCH ?
            """
            params = [query]

            if obs_type:
                sql += " AND o.type = ?"
                params.append(obs_type)

            sql += " ORDER BY o.created_at DESC LIMIT ?"
            params.append(str(limit))

            cursor.execute(sql, params)
            results = [dict(row) for row in cursor.fetchall()]
            return results
        except sqlite3.Error as e:
            logger.error(f"Search failed: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_observations(self, ids: List[int]) -> List[Observation]:
        """
        Fetch full observation details by IDs.
        This is the final layer - fetch details ONLY for filtered IDs.
        Security: Parameterized queries to prevent SQL injection.
        """
        if not ids:
            return []

        # Validate input IDs to prevent injection
        if not all(isinstance(id_, int) and id_ > 0 for id_ in ids):
            logger.error("Invalid observation IDs provided")
            return []

        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Security: Use parameterized query to prevent SQL injection
            placeholders = ",".join("?" * len(ids))
            sql = f"""
                SELECT * FROM observations
                WHERE id IN ({placeholders})
                ORDER BY created_at DESC
            """
            cursor.execute(sql, ids)

            results = [Observation(**dict(row)) for row in cursor.fetchall()]
            return results
        except sqlite3.Error as e:
            logger.error(f"Failed to get observations: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_timeline(self, session_id: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Get chronological timeline of observations."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            if session_id:
                cursor.execute(
                    """
                    SELECT id, type, summary, created_at
                    FROM observations
                    WHERE session_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """,
                    (session_id, limit),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, type, summary, created_at
                    FROM observations
                    ORDER BY created_at DESC
                    LIMIT ?
                """,
                    (limit,),
                )

            results = [dict(row) for row in cursor.fetchall()]
            return results
        except sqlite3.Error as e:
            logger.error(f"Timeline fetch failed: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_recent(self, limit: int = 10) -> List[Dict]:
        """Get recent observations."""
        return self.get_timeline(limit=limit)

    def export_json(self, output_path: Path):
        """Export all observations to JSON."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM observations ORDER BY created_at DESC")
            results = [dict(row) for row in cursor.fetchall()]

            output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
            logger.info(f"Exported {len(results)} memories to {output_path}")
            return len(results)
        except (sqlite3.Error, OSError) as e:
            logger.error(f"Export failed: {e}")
            return 0
        finally:
            if conn:
                conn.close()


if __name__ == "__main__":
    print("🧠 Initializing Memory...")
    print("=" * 60)

    mem = Memory()
    mem.add_observation("System initialized successfully.", "system")
    recent = mem.get_recent(1)

    print(f"Recent Memory: {recent[0] if recent else 'None'}")
