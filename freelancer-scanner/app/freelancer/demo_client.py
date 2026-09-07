"""Liefert die fuenf Beispielprojekte statt echter API-Daten."""

from __future__ import annotations

from typing import Any

from app.freelancer.client import FreelancerClient
from app.freelancer.demo_data import DEMO_PROJECTS
from app.logging_setup import get_logger

logger = get_logger(__name__)


class DemoFreelancerClient(FreelancerClient):
    name = "demo"

    def __init__(self) -> None:
        self._served = False

    def search(self, keyword: str, limit: int = 30) -> list[dict[str, Any]]:
        """Gibt beim ersten Aufruf alle Beispiele zurueck, danach nichts mehr.

        So entstehen im Demo-Modus genau fuenf Projekte statt fuenf pro
        Suchbegriff -- und die Dublettenpruefung wird trotzdem geprueft,
        weil ein zweiter Scan-Durchlauf nichts Neues anlegen darf.
        """
        if self._served:
            return []
        self._served = True
        logger.info("DEMO_MODE: %s Beispielprojekte werden geliefert.", len(DEMO_PROJECTS))
        return [dict(project) for project in DEMO_PROJECTS]

    def reset(self) -> None:
        self._served = False


def build_client(settings=None) -> FreelancerClient:
    """Waehlt anhand der Konfiguration die passende Projektquelle."""
    from app.config import get_settings

    settings = settings or get_settings()
    if settings.demo_mode:
        return DemoFreelancerClient()

    from app.freelancer.live_client import LiveFreelancerClient

    return LiveFreelancerClient(settings)
