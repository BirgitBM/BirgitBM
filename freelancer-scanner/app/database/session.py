"""Datenbankverbindung.

Der Wechsel von SQLite auf PostgreSQL/Supabase erfolgt allein ueber
DATABASE_URL in der .env-Datei. Es ist keine Code-Aenderung noetig.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import Session, sessionmaker

from app.config import ensure_data_dir, get_settings
from app.logging_setup import get_logger
from app.models.project import Base

logger = get_logger(__name__)

_engine: Engine | None = None
_SessionFactory: sessionmaker[Session] | None = None


def _create_engine(database_url: str) -> Engine:
    kwargs: dict = {"future": True, "pool_pre_ping": True}
    if database_url.startswith("sqlite"):
        # check_same_thread=False, weil Scheduler und Webserver in
        # unterschiedlichen Threads auf dieselbe Datenbank zugreifen.
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in database_url:
            # Ohne StaticPool bekaeme jeder Thread seine eigene, leere
            # In-Memory-Datenbank. Betrifft vor allem die Tests.
            kwargs["poolclass"] = StaticPool
    return create_engine(database_url, **kwargs)


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        settings = get_settings()
        if settings.database_url.startswith("sqlite"):
            ensure_data_dir()
        _engine = _create_engine(settings.database_url)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _SessionFactory
    if _SessionFactory is None:
        _SessionFactory = sessionmaker(bind=get_engine(), expire_on_commit=False, future=True)
    return _SessionFactory


# Spalten, die nach Version 1.0 dazugekommen sind. Wer die Anwendung
# schon einmal laufen liess, hat sie in seiner Datei noch nicht.
_ADDED_COLUMNS: dict[str, str] = {
    "opportunity_score": "FLOAT",
    "effective_hourly_rate_usd": "FLOAT",
    "budget_hourly_rate_usd": "FLOAT",
    "automation_leverage": "FLOAT",
    "freshness_bonus": "FLOAT",
    "age_minutes": "FLOAT",
    "is_arbitrage": "BOOLEAN DEFAULT 0",
}


def _migrate_missing_columns(engine: Engine) -> None:
    """Ergaenzt fehlende Spalten in einer bestehenden Datenbank.

    Nur additiv: es wird nichts geloescht und nichts umbenannt. Damit
    bleibt eine Datenbank aus einer aelteren Version nutzbar, ohne dass
    sie geloescht werden muss.
    """
    inspector = inspect(engine)
    if "projects" not in inspector.get_table_names():
        return

    vorhanden = {column["name"] for column in inspector.get_columns("projects")}
    fehlend = {
        name: typ for name, typ in _ADDED_COLUMNS.items() if name not in vorhanden
    }
    if not fehlend:
        return

    with engine.begin() as connection:
        for name, typ in fehlend.items():
            connection.execute(text(f"ALTER TABLE projects ADD COLUMN {name} {typ}"))

    logger.info(
        "Datenbank ergaenzt: %s neue Spalte(n) (%s). Bestehende Projekte "
        "behalten ihre Bewertung, die neuen Felder bleiben bei ihnen leer.",
        len(fehlend),
        ", ".join(sorted(fehlend)),
    )


def init_db() -> None:
    """Legt fehlende Tabellen und Spalten an. Bestehende Daten bleiben erhalten."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    _migrate_missing_columns(engine)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Transaktion mit automatischem Commit bzw. Rollback."""
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def configure_for_tests(database_url: str) -> None:
    """Setzt die Verbindung zurueck -- nur fuer Tests."""
    global _engine, _SessionFactory
    _engine = _create_engine(database_url)
    _SessionFactory = sessionmaker(bind=_engine, expire_on_commit=False, future=True)
    Base.metadata.create_all(bind=_engine)
    _migrate_missing_columns(_engine)
