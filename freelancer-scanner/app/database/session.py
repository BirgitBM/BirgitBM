"""Datenbankverbindung.

Der Wechsel von SQLite auf PostgreSQL/Supabase erfolgt allein ueber
DATABASE_URL in der .env-Datei. Es ist keine Code-Aenderung noetig.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import Session, sessionmaker

from app.config import ensure_data_dir, get_settings
from app.models.project import Base

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


def init_db() -> None:
    """Legt fehlende Tabellen an. Bestehende Daten bleiben erhalten."""
    Base.metadata.create_all(bind=get_engine())


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
