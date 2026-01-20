"""
Memory engine for operations.
"""
import json
import logging
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional

from .models import Observation
from .storage import StorageManager

logger = logging.getLogger(__name__)

class Memory(StorageManager):
    """
    AgencyOS Memory System.
    Persists contextual observations using SQLite with Full-Text Search (FTS5).
    """

    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            memory_dir = Path.home() / ".agencyos" / "memory"
            memory_dir.mkdir(parents=True, exist_ok=True)
            db_path = memory_dir / "sessions.db"

        super().__init__(db_path)
        logger.info(f"Memory system initialized at {db_path}")

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
            summary = content[:100] + "..." if len(content) > 100 else content

        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO observations (session_id, type, content, summary) VALUES (?, ?, ?, ?)",
                (session_id, obs_type, content, summary),
            )
            obs_id = cursor.lastrowid
            conn.commit()
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
        """Search memory using FTS5."""
        conn = None
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
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
            return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            logger.error(f"Search failed: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_observations(self, ids: List[int]) -> List[Observation]:
        """Fetch full observation details by IDs."""
        if not ids or not all(isinstance(id_, int) and id_ > 0 for id_ in ids):
            return []
        conn = None
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            placeholders = ",".join("?" * len(ids))
            sql = f"SELECT * FROM observations WHERE id IN ({placeholders}) ORDER BY created_at DESC"
            cursor.execute(sql, ids)
            return [Observation(**dict(row)) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            logger.error(f"Failed to get observations: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_timeline(self, session_id: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """Get chronological timeline."""
        conn = None
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if session_id:
                cursor.execute(
                    "SELECT id, type, summary, created_at FROM observations WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
                    (session_id, limit),
                )
            else:
                cursor.execute(
                    "SELECT id, type, summary, created_at FROM observations ORDER BY created_at DESC LIMIT ?",
                    (limit,),
                )
            return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            logger.error(f"Timeline fetch failed: {e}")
            return []
        finally:
            if conn:
                conn.close()

    def get_recent(self, limit: int = 10) -> List[Dict]:
        return self.get_timeline(limit=limit)

    def export_json(self, output_path: Path):
        """Export to JSON."""
        conn = None
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM observations ORDER BY created_at DESC")
            results = [dict(row) for row in cursor.fetchall()]
            output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
            return len(results)
        except (sqlite3.Error, OSError) as e:
            logger.error(f"Export failed: {e}")
            return 0
        finally:
            if conn:
                conn.close()
