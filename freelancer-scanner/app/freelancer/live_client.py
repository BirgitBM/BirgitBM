"""Zugriff auf die offizielle Freelancer.com REST-API.

Endpunkt, Authentifizierungs-Header und Parameternamen stammen aus dem
offiziellen Python-SDK von Freelancer.com:
https://github.com/freelancer/freelancer-sdk-python

Es findet kein Web-Scraping statt.
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from app.config import Settings, get_settings
from app.freelancer.client import FreelancerAPIError, FreelancerClient
from app.logging_setup import get_logger

logger = get_logger(__name__)

SEARCH_PATH = "/projects/0.1/projects/active/"
AUTH_HEADER = "Freelancer-OAuth-V1"

# Wie oft bei zeitweiligen Fehlern erneut versucht wird (Sekunden Wartezeit).
RETRY_BACKOFF_SECONDS = (2, 4, 8)
RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class LiveFreelancerClient(FreelancerClient):
    name = "live"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        if not self.settings.freelancer_oauth_token:
            raise FreelancerAPIError(
                "FREELANCER_OAUTH_TOKEN fehlt. Trage den Token in die .env-Datei ein "
                "oder setze DEMO_MODE=true."
            )
        self._client = httpx.Client(
            base_url=self.settings.freelancer_api_base.rstrip("/"),
            timeout=float(self.settings.freelancer_timeout_seconds),
            headers={
                AUTH_HEADER: self.settings.freelancer_oauth_token,
                "Accept": "application/json",
                "User-Agent": "freelancer-scanner/1.0",
            },
        )

    # ------------------------------------------------------------------
    def _request(self, params: list[tuple[str, Any]]) -> dict[str, Any]:
        """GET mit Timeout, Rate-Limit-Beachtung und Backoff."""
        last_error: str = "unbekannt"

        for attempt in range(len(RETRY_BACKOFF_SECONDS) + 1):
            try:
                response = self._client.get(SEARCH_PATH, params=params)
            except httpx.TimeoutException:
                last_error = f"Zeitueberschreitung nach {self.settings.freelancer_timeout_seconds}s"
            except httpx.HTTPError as exc:
                last_error = f"Netzwerkfehler: {exc}"
            else:
                if response.status_code == 401:
                    raise FreelancerAPIError(
                        "Freelancer hat den Zugang abgelehnt (401). Der OAuth-Token ist "
                        "ungueltig oder abgelaufen."
                    )
                if response.status_code == 403:
                    raise FreelancerAPIError(
                        "Freelancer hat den Zugriff verweigert (403). Der Token hat "
                        "vermutlich nicht die noetigen Berechtigungen."
                    )
                if response.status_code in RETRYABLE_STATUS:
                    last_error = f"HTTP {response.status_code}"
                    # Rate-Limit: die von der API vorgegebene Wartezeit beachten.
                    retry_after = response.headers.get("Retry-After")
                    if retry_after:
                        try:
                            wait = min(float(retry_after), 60.0)
                            logger.warning("Rate-Limit erreicht, warte %.0fs.", wait)
                            time.sleep(wait)
                            continue
                        except ValueError:
                            pass
                elif response.status_code >= 400:
                    raise FreelancerAPIError(
                        f"Freelancer-API antwortete mit HTTP {response.status_code}: "
                        f"{response.text[:300]}"
                    )
                else:
                    try:
                        return response.json()
                    except ValueError as exc:
                        raise FreelancerAPIError(
                            f"Antwort der Freelancer-API war kein gueltiges JSON: {exc}"
                        ) from exc

            if attempt < len(RETRY_BACKOFF_SECONDS):
                wait = RETRY_BACKOFF_SECONDS[attempt]
                logger.warning(
                    "Freelancer-Abfrage fehlgeschlagen (%s). Neuer Versuch in %ss.",
                    last_error,
                    wait,
                )
                time.sleep(wait)

        raise FreelancerAPIError(
            f"Freelancer-API nach {len(RETRY_BACKOFF_SECONDS) + 1} Versuchen nicht "
            f"erreichbar. Letzter Fehler: {last_error}"
        )

    # ------------------------------------------------------------------
    def search(self, keyword: str, limit: int = 30) -> list[dict[str, Any]]:
        from_time = int(time.time()) - self.settings.freelancer_max_age_hours * 3600

        # Liste von Tupeln, weil die API Mehrfachwerte als project_types[] erwartet.
        params: list[tuple[str, Any]] = [
            ("query", keyword),
            ("limit", limit),
            ("offset", 0),
            ("from_time", from_time),
            ("sort_field", "time_updated"),
            ("full_description", "true"),
            ("job_details", "true"),
            ("user_details", "true"),
            ("user_status", "true"),
            ("user_country_details", "true"),
            ("project_types[]", "fixed"),
            ("project_types[]", "hourly"),
        ]

        payload = self._request(params)

        if payload.get("status") not in (None, "success"):
            raise FreelancerAPIError(
                f"Freelancer-API meldete Status '{payload.get('status')}': "
                f"{payload.get('message', 'keine Details')}"
            )

        result = payload.get("result") or {}
        projects = result.get("projects") or []
        users = result.get("users") or {}

        # Die Nutzerdaten an jedes Projekt anhaengen, damit der Mapper
        # ohne zweite Abfrage auskommt.
        for project in projects:
            if isinstance(project, dict):
                project["_users"] = users

        logger.info("Freelancer-Suche '%s': %s Projekte.", keyword, len(projects))
        return [project for project in projects if isinstance(project, dict)]

    def close(self) -> None:
        self._client.close()
