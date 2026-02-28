"""Recipe Registry for RaaS — publish, search, and clone public recipes."""
from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.raas.auth import TenantContext, get_tenant_context

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

RECIPE_CATEGORIES: List[str] = ["marketing", "operations", "content", "analytics", "custom"]

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_DDL = """
CREATE TABLE IF NOT EXISTS recipe_entries (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    description      TEXT NOT NULL,
    category         TEXT NOT NULL,
    content          TEXT NOT NULL,
    author_tenant_id TEXT NOT NULL,
    is_public        INT  NOT NULL DEFAULT 1,
    clone_count      INT  NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL
);
"""


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class RecipeEntry:
    """Snapshot of a recipe registry record."""

    id: str
    name: str
    description: str
    category: str
    content: str
    author_tenant_id: str
    is_public: bool = True
    clone_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PublishRecipeRequest(BaseModel):
    """Request body for POST /recipes."""

    name: str
    description: str
    category: str
    content: str


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


class RecipeRegistry:
    """SQLite-backed registry for sharing and discovering recipes across tenants."""

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        """Initialise and ensure the recipe_entries table exists."""
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        try:
            with self._connect() as conn:
                conn.execute(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialise recipe registry DB: {exc}") from exc

    @staticmethod
    def _to_entry(row: sqlite3.Row) -> RecipeEntry:
        return RecipeEntry(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            category=row["category"],
            content=row["content"],
            author_tenant_id=row["author_tenant_id"],
            is_public=bool(row["is_public"]),
            clone_count=int(row["clone_count"]),
            created_at=row["created_at"],
        )

    def publish(
        self,
        tenant_id: str,
        name: str,
        description: str,
        category: str,
        content: str,
    ) -> RecipeEntry:
        """Validate category and persist a new public recipe."""
        if category not in RECIPE_CATEGORIES:
            raise ValueError(f"Invalid category '{category}'. Must be one of: {RECIPE_CATEGORIES}")

        entry = RecipeEntry(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            category=category,
            content=content,
            author_tenant_id=tenant_id,
        )
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO recipe_entries "
                    "(id, name, description, category, content, author_tenant_id, "
                    " is_public, clone_count, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    (entry.id, entry.name, entry.description, entry.category,
                     entry.content, entry.author_tenant_id,
                     int(entry.is_public), entry.clone_count, entry.created_at),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to publish recipe '{name}': {exc}") from exc
        return entry

    def search(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[RecipeEntry]:
        """LIKE search on name+description; optional category filter."""
        conditions = ["is_public = 1"]
        params: list = []

        if query:
            conditions.append("(name LIKE ? OR description LIKE ?)")
            like = f"%{query}%"
            params.extend([like, like])
        if category:
            conditions.append("category = ?")
            params.append(category)

        params.extend([limit, offset])
        sql = (
            f"SELECT * FROM recipe_entries WHERE {' AND '.join(conditions)} "
            "ORDER BY created_at DESC LIMIT ? OFFSET ?"
        )
        try:
            with self._connect() as conn:
                rows = conn.execute(sql, params).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to search recipes: {exc}") from exc
        return [self._to_entry(r) for r in rows]

    def get(self, recipe_id: str) -> Optional[RecipeEntry]:
        """Return a single recipe by ID, or None if not found."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM recipe_entries WHERE id = ?", (recipe_id,)
                ).fetchone()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to fetch recipe '{recipe_id}': {exc}") from exc
        return self._to_entry(row) if row else None

    def clone(self, recipe_id: str, tenant_id: str) -> RecipeEntry:
        """Copy a public recipe to tenant's private collection; increments clone_count."""
        original = self.get(recipe_id)
        if original is None:
            raise ValueError(f"Recipe '{recipe_id}' not found.")
        if not original.is_public:
            raise ValueError(f"Recipe '{recipe_id}' is not public and cannot be cloned.")

        cloned = RecipeEntry(
            id=str(uuid.uuid4()),
            name=original.name,
            description=original.description,
            category=original.category,
            content=original.content,
            author_tenant_id=tenant_id,
            is_public=False,
        )
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO recipe_entries "
                    "(id, name, description, category, content, author_tenant_id, "
                    " is_public, clone_count, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    (cloned.id, cloned.name, cloned.description, cloned.category,
                     cloned.content, cloned.author_tenant_id,
                     int(cloned.is_public), cloned.clone_count, cloned.created_at),
                )
                conn.execute(
                    "UPDATE recipe_entries SET clone_count = clone_count + 1 WHERE id = ?",
                    (recipe_id,),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to clone recipe '{recipe_id}': {exc}") from exc
        return cloned


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_registry: Optional[RecipeRegistry] = None


def _get_registry() -> RecipeRegistry:
    global _registry  # noqa: PLW0603
    if _registry is None:
        _registry = RecipeRegistry()
    return _registry


# ---------------------------------------------------------------------------
# FastAPI Router
# ---------------------------------------------------------------------------

raas_registry_router = APIRouter(tags=["recipes"])


@raas_registry_router.get("/recipes")
def browse_recipes(
    query: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[dict]:
    """GET /recipes — browse public recipes (query, category, limit, offset)."""
    try:
        entries = _get_registry().search(query=query, category=category, limit=limit, offset=offset)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return [vars(e) for e in entries]


@raas_registry_router.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: str) -> dict:
    """GET /recipes/{recipe_id} — return full recipe detail."""
    try:
        entry = _get_registry().get(recipe_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found.")
    return vars(entry)


@raas_registry_router.post("/recipes", status_code=201)
def publish_recipe(
    body: PublishRecipeRequest,
    tenant: TenantContext = Depends(get_tenant_context),
) -> dict:
    """POST /recipes — publish a recipe (auth required)."""
    try:
        entry = _get_registry().publish(
            tenant_id=tenant.tenant_id,
            name=body.name,
            description=body.description,
            category=body.category,
            content=body.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return vars(entry)


@raas_registry_router.post("/recipes/{recipe_id}/clone", status_code=201)
def clone_recipe(
    recipe_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
) -> dict:
    """POST /recipes/{recipe_id}/clone — clone a public recipe (auth required)."""
    try:
        entry = _get_registry().clone(recipe_id=recipe_id, tenant_id=tenant.tenant_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return vars(entry)
