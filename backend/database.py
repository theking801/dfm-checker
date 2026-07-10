"""
database.py — Base de données SQLite pour DFM Checker Admin

Tables :
- analytics : stats d'utilisation (analyses, problèmes, matériaux)
- errors    : logs d'erreurs
- feedbacks : retours utilisateurs

Utilise sqlite3 (stdlib) avec WAL mode pour un bon perf en lecture/écriture.
Toutes les fonctions sont synchrones — FastAPI les exécute dans un threadpool.
"""

import sqlite3
import os
import threading
from datetime import datetime, date
from pathlib import Path
from typing import Optional

# ── Configuration ──
DB_DIR = os.getenv("DB_DIR", "data")
DB_PATH = os.path.join(DB_DIR, "dfm_checker.db")

# Thread-local storage pour les connexions
_local = threading.local()


def get_connection() -> sqlite3.Connection:
    """Retourne une connexion thread-local."""
    if not hasattr(_local, "conn") or _local.conn is None:
        os.makedirs(DB_DIR, exist_ok=True)
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


# ── Initialisation ──

def init_db():
    """Crée les tables si elles n'existent pas."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS analytics (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT NOT NULL DEFAULT (date('now')),
            material    TEXT NOT NULL,
            problems_count INTEGER NOT NULL DEFAULT 0,
            high_count  INTEGER NOT NULL DEFAULT 0,
            medium_count INTEGER NOT NULL DEFAULT 0,
            low_count   INTEGER NOT NULL DEFAULT 0,
            error       INTEGER NOT NULL DEFAULT 0,
            error_msg   TEXT,
            file_size_kb REAL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS errors (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
            type        TEXT NOT NULL CHECK(type IN ('api','upload','analysis','system')),
            message     TEXT NOT NULL,
            details     TEXT NOT NULL DEFAULT '',
            severity    TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('high','medium','low')),
            resolved    INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS feedbacks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT NOT NULL DEFAULT (date('now')),
            message     TEXT NOT NULL,
            email       TEXT NOT NULL DEFAULT '',
            status      TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','archived'))
        );

        CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
        CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp);
        CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
    """)
    conn.commit()


# ── Analytics ──

def log_analysis(
    material: str,
    problems_count: int,
    high_count: int,
    medium_count: int,
    low_count: int,
    error: bool = False,
    error_msg: Optional[str] = None,
    file_size_kb: Optional[float] = None,
):
    conn = get_connection()
    conn.execute(
        """INSERT INTO analytics (material, problems_count, high_count, medium_count, low_count, error, error_msg, file_size_kb)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (material, problems_count, high_count, medium_count, low_count,
         int(error), error_msg, file_size_kb),
    )
    conn.commit()


def get_dashboard_stats():
    """Retourne les stats agrégées pour le dashboard admin."""
    conn = get_connection()

    # Stats globales
    total = conn.execute(
        "SELECT COUNT(*) as total, COALESCE(SUM(problems_count),0) as problems, "
        "COALESCE(SUM(error),0) as errors, COALESCE(SUM(high_count),0) as high_total "
        "FROM analytics"
    ).fetchone()

    # Analyses par jour (7 derniers jours)
    daily = conn.execute(
        """SELECT date, COUNT(*) as analyses,
                  COALESCE(SUM(error),0) as errors
           FROM analytics
           WHERE date >= date('now', '-6 days')
           GROUP BY date
           ORDER BY date ASC"""
    ).fetchall()

    # Feedbacks count
    feedbacks_count = conn.execute(
        "SELECT COUNT(*) FROM feedbacks"
    ).fetchone()[0]

    # New feedbacks
    new_feedbacks = conn.execute(
        "SELECT COUNT(*) FROM feedbacks WHERE status='new'"
    ).fetchone()[0]

    # Recent errors (5 last)
    recent_errors = conn.execute(
        """SELECT id, timestamp, type, message, details, severity, resolved
           FROM errors ORDER BY timestamp DESC LIMIT 5"""
    ).fetchall()

    return {
        "total_analyses": total["total"],
        "total_problems": total["problems"],
        "total_errors": total["errors"],
        "high_severity_total": total["high_total"],
        "unresolved_errors": conn.execute(
            "SELECT COUNT(*) FROM errors WHERE resolved=0"
        ).fetchone()[0],
        "total_feedbacks": feedbacks_count,
        "new_feedbacks": new_feedbacks,
        "daily": [dict(d) for d in daily],
        "recent_errors": [dict(e) for e in recent_errors],
    }


# ── Errors ──

def log_error(
    type: str,
    message: str,
    details: str = "",
    severity: str = "medium",
):
    conn = get_connection()
    conn.execute(
        "INSERT INTO errors (type, message, details, severity) VALUES (?, ?, ?, ?)",
        (type, message, details, severity),
    )
    conn.commit()


def get_errors(
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
):
    conn = get_connection()
    query = "SELECT * FROM errors WHERE 1=1"
    params = []

    if severity and severity != "all":
        query += " AND severity = ?"
        params.append(severity)
    if resolved is not None:
        query += " AND resolved = ?"
        params.append(int(resolved))

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    total = conn.execute(
        "SELECT COUNT(*) FROM errors WHERE 1=1" +
        (" AND severity = ?" if severity and severity != "all" else "") +
        (" AND resolved = ?" if resolved is not None else ""),
        [p for p in params[:-2]]
    ).fetchone()[0]

    return {"errors": [dict(r) for r in rows], "total": total}


def toggle_error_resolved(error_id: int):
    conn = get_connection()
    conn.execute(
        "UPDATE errors SET resolved = CASE WHEN resolved THEN 0 ELSE 1 END WHERE id = ?",
        (error_id,),
    )
    conn.commit()


# ── Feedbacks ──

def add_feedback(message: str, email: str = ""):
    conn = get_connection()
    conn.execute(
        "INSERT INTO feedbacks (message, email) VALUES (?, ?)",
        (message, email),
    )
    conn.commit()
    return conn.execute("SELECT last_insert_rowid()").fetchone()[0]


def get_feedbacks():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM feedbacks ORDER BY date DESC, id DESC"
    ).fetchall()
    return [dict(r) for r in rows]


def update_feedback_status(feedback_id: int, status: str):
    conn = get_connection()
    conn.execute(
        "UPDATE feedbacks SET status = ? WHERE id = ?",
        (status, feedback_id),
    )
    conn.commit()


# ── Init au premier import ──
init_db()
