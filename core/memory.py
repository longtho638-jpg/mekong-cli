"""
AgencyOS Memory System
Based on claude-mem architecture with progressive disclosure.

Storage: SQLite for persistence
Pattern: 3-layer workflow (search → timeline → get_observations)
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict


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
    """AgencyOS Memory System with SQLite storage."""
    
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            # Default: ~/.agencyos/memory/sessions.db
            memory_dir = Path.home() / ".agencyos" / "memory"
            memory_dir.mkdir(parents=True, exist_ok=True)
            db_path = memory_dir / "sessions.db"
        
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize SQLite database with FTS5 for full-text search."""
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
        conn.close()
    
    def add_observation(
        self,
        content: str,
        obs_type: str = "note",
        session_id: str = "default",
        summary: Optional[str] = None
    ) -> int:
        """Add a memory observation."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if summary is None:
            # Auto-summarize (simple truncate for now)
            summary = content[:100] + "..." if len(content) > 100 else content
        
        cursor.execute("""
            INSERT INTO observations (session_id, type, content, summary)
            VALUES (?, ?, ?, ?)
        """, (session_id, obs_type, content, summary))
        
        obs_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return obs_id
    
    def search_memory(
        self,
        query: str,
        limit: int = 10,
        obs_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Search memory using FTS5 full-text search.
        Returns compact index (~50-100 tokens/result).
        """
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
        params.append(limit)
        
        cursor.execute(sql, params)
        results = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return results
    
    def get_observations(self, ids: List[int]) -> List[Observation]:
        """
        Fetch full observation details by IDs.
        This is the final layer - fetch details ONLY for filtered IDs.
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        placeholders = ','.join('?' * len(ids))
        cursor.execute(f"""
            SELECT * FROM observations
            WHERE id IN ({placeholders})
            ORDER BY created_at DESC
        """, ids)
        
        results = [
            Observation(**dict(row))
            for row in cursor.fetchall()
        ]
        
        conn.close()
        return results
    
    def get_timeline(
        self,
        session_id: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Get chronological timeline of observations."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if session_id:
            cursor.execute("""
                SELECT id, type, summary, created_at
                FROM observations
                WHERE session_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (session_id, limit))
        else:
            cursor.execute("""
                SELECT id, type, summary, created_at
                FROM observations
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def get_recent(self, limit: int = 10) -> List[Dict]:
        """Get recent observations."""
        return self.get_timeline(limit=limit)
    
    def export_json(self, output_path: Path):
        """Export all observations to JSON."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM observations ORDER BY created_at DESC")
        results = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
        return len(results)
