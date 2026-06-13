"""
Persistent ingestion-task store (SQLite).

The API previously tracked background ingestion tasks in a module-level dict,
which is lost on restart and not safe across the threadpool that FastAPI runs
background tasks in. This stores each task as a JSON blob in a small SQLite
database (stdlib, local-first), surviving restarts and tolerating concurrent
access by opening a short-lived connection per operation.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import closing, contextmanager
from pathlib import Path
from typing import Any, Iterator, Optional

from src.utils.logger import get_logger

log = get_logger(__name__)


class TaskStore:
    """Thread-safe, restart-safe store for ingestion task records."""

    def __init__(self, db_path: str = "data/tasks.db") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._init_db()

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        """Yield a connection that is committed on success and always closed."""
        conn = sqlite3.connect(str(self.db_path), timeout=30)
        conn.row_factory = sqlite3.Row
        try:
            with closing(conn):
                yield conn
                conn.commit()
        except Exception:
            conn.rollback()
            raise

    def _init_db(self) -> None:
        with self._lock, self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS ingest_tasks (
                    task_id    TEXT PRIMARY KEY,
                    collection TEXT,
                    data       TEXT NOT NULL,
                    updated_at TEXT
                )
                """
            )

    # ------------------------------------------------------------------ #
    # CRUD
    # ------------------------------------------------------------------ #

    def create(self, task_id: str, data: dict[str, Any]) -> None:
        with self._lock, self._conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO ingest_tasks (task_id, collection, data, updated_at) "
                "VALUES (?, ?, ?, datetime('now'))",
                (task_id, data.get("collection", ""), json.dumps(data)),
            )

    def update(self, task_id: str, **fields: Any) -> None:
        """Merge *fields* into the stored task record (no-op if missing)."""
        with self._lock, self._conn() as conn:
            row = conn.execute(
                "SELECT data FROM ingest_tasks WHERE task_id = ?", (task_id,)
            ).fetchone()
            if row is None:
                return
            data = json.loads(row["data"])
            data.update(fields)
            conn.execute(
                "UPDATE ingest_tasks SET data = ?, collection = ?, updated_at = datetime('now') "
                "WHERE task_id = ?",
                (json.dumps(data), data.get("collection", ""), task_id),
            )

    def get(self, task_id: str) -> Optional[dict[str, Any]]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT data FROM ingest_tasks WHERE task_id = ?", (task_id,)
            ).fetchone()
        return json.loads(row["data"]) if row else None

    def exists(self, task_id: str) -> bool:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT 1 FROM ingest_tasks WHERE task_id = ?", (task_id,)
            ).fetchone()
        return row is not None

    def all(self, collection: Optional[str] = None) -> list[dict[str, Any]]:
        with self._conn() as conn:
            if collection:
                rows = conn.execute(
                    "SELECT data FROM ingest_tasks WHERE collection = ? ORDER BY updated_at",
                    (collection,),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT data FROM ingest_tasks ORDER BY updated_at"
                ).fetchall()
        return [json.loads(r["data"]) for r in rows]


# Module-level singleton used by the API routes.
_store: Optional[TaskStore] = None


def get_task_store() -> TaskStore:
    """Return the process-wide task store singleton."""
    global _store
    if _store is None:
        _store = TaskStore()
    return _store
