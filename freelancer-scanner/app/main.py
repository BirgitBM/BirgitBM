"""Einstiegspunkt: Webserver, Dashboard und Scanner in einem Prozess.

Starten mit:
    uvicorn app.main:app --reload
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import actions, dashboard
from app.config import BASE_DIR, get_scoring_config, get_settings
from app.database.session import init_db
from app.logging_setup import get_logger, setup_logging
from app.services.scanner import run_scan

settings = get_settings()
setup_logging(settings.log_level)
logger = get_logger(__name__)

scheduler: BackgroundScheduler | None = None


def _scheduled_scan() -> None:
    """Wrapper fuer den Scheduler -- Fehler duerfen ihn nie stoppen."""
    try:
        run_scan()
    except Exception:  # noqa: BLE001
        logger.exception("Geplanter Scan fehlgeschlagen. Der naechste Lauf folgt planmaessig.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler

    init_db()
    scoring = get_scoring_config()

    logger.info("─" * 62)
    logger.info("Freelancer Scanner startet")
    logger.info("  Demo-Modus     : %s", "AN (keine externen Zugriffe)" if settings.demo_mode else "aus")
    logger.info("  LLM-Anbieter   : %s", settings.effective_llm_provider)
    logger.info("  Mindestscore   : %s", scoring.min_score)
    logger.info("  Ziel-Stundensatz: %s USD", scoring.target_hourly_rate_usd)
    logger.info("  Dashboard      : http://127.0.0.1:8000")
    logger.info("─" * 62)

    if settings.scanner_enabled:
        scheduler = BackgroundScheduler(timezone="UTC")
        scheduler.add_job(
            _scheduled_scan,
            trigger=IntervalTrigger(minutes=settings.scan_interval_minutes),
            id="freelancer_scan",
            name="Freelancer-Scan",
            max_instances=1,        # nie zwei Scans gleichzeitig
            coalesce=True,          # verpasste Laeufe zusammenfassen
            misfire_grace_time=120,
        )
        scheduler.start()
        logger.info("Scanner laeuft alle %s Minuten.", settings.scan_interval_minutes)
    else:
        logger.info("Automatischer Scanner ist deaktiviert (SCANNER_ENABLED=false).")

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
        logger.info("Scanner gestoppt.")


app = FastAPI(
    title="Freelancer Scanner",
    description=(
        "Findet und bewertet Automatisierungsprojekte auf Freelancer.com. "
        "Bewirbt sich niemals automatisch."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "app" / "static")), name="static")
app.include_router(dashboard.router)
app.include_router(actions.router)
