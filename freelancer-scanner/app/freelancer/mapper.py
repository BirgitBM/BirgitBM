"""Wandelt Rohdaten der Freelancer-API in unser Projektmodell um.

Bewusst defensiv: fehlende oder unerwartete Felder duerfen niemals
den gesamten Scan-Durchlauf abbrechen.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.logging_setup import get_logger
from app.models.project import Project

logger = get_logger(__name__)

PROJECT_URL_TEMPLATE = "https://www.freelancer.com/projects/{seo_url}"


def _timestamp_to_datetime(value: Any) -> datetime | None:
    if value in (None, "", 0):
        return None
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _float_or_none(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _int_or_none(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _project_url(raw: dict[str, Any]) -> str:
    if raw.get("url"):
        return str(raw["url"])
    seo_url = raw.get("seo_url")
    if seo_url:
        return PROJECT_URL_TEMPLATE.format(seo_url=seo_url)
    project_id = raw.get("id")
    return f"https://www.freelancer.com/projects/{project_id}" if project_id else ""


def _employer_verified(raw: dict[str, Any], users: dict[str, Any] | None) -> bool | None:
    """Zahlungsmethode des Auftraggebers verifiziert?

    Die API liefert die Nutzerdaten in einem eigenen Block, der ueber
    owner_id verknuepft ist.
    """
    if "employer_verified" in raw:
        return raw.get("employer_verified")
    if not users:
        return None
    owner = users.get(str(raw.get("owner_id")))
    if not isinstance(owner, dict):
        return None
    status = owner.get("status") or {}
    verified = status.get("payment_verified")
    return bool(verified) if verified is not None else None


def _employer_country(raw: dict[str, Any], users: dict[str, Any] | None) -> str | None:
    if raw.get("employer_country"):
        return str(raw["employer_country"])
    if not users:
        return None
    owner = users.get(str(raw.get("owner_id")))
    if not isinstance(owner, dict):
        return None
    location = owner.get("location") or {}
    country = location.get("country") or {}
    name = country.get("name")
    return str(name) if name else None


def to_project(
    raw: dict[str, Any],
    *,
    matched_keyword: str | None = None,
    users: dict[str, Any] | None = None,
) -> Project | None:
    """Baut ein Project-Objekt. Gibt None zurueck, wenn die ID fehlt."""
    # "id" ist das Feld der Freelancer-API. "freelancer_id" erlaubt es,
    # bereits aufbereitete Daten (Demo, Tests) durch denselben Mapper zu
    # schicken -- so wird immer derselbe Weg getestet.
    project_id = raw.get("id") or raw.get("freelancer_id")
    if project_id in (None, ""):
        logger.warning("Projekt ohne ID uebersprungen: %s", str(raw)[:120])
        return None

    # Die API liefert verschachtelte Objekte, aufbereitete Daten oft
    # flache Werte. Beides muss durch denselben Mapper laufen koennen.
    budget = raw.get("budget") if isinstance(raw.get("budget"), dict) else {}
    bid_stats = raw.get("bid_stats") if isinstance(raw.get("bid_stats"), dict) else {}
    jobs = raw.get("jobs") or []

    raw_currency = raw.get("currency")
    if isinstance(raw_currency, dict):
        currency_code = raw_currency.get("code")
    else:
        currency_code = raw_currency

    skills = [
        str(job.get("name"))
        for job in jobs
        if isinstance(job, dict) and job.get("name")
    ]

    description = raw.get("description") or raw.get("preview_description") or ""

    return Project(
        freelancer_id=str(project_id),
        title=str(raw.get("title") or "").strip()[:500],
        description=str(description).strip(),
        url=_project_url(raw),
        posted_at=_timestamp_to_datetime(
            raw.get("time_submitted") or raw.get("posted_at")
        ),
        budget_min=_float_or_none(budget.get("minimum") or raw.get("budget_min")),
        budget_max=_float_or_none(budget.get("maximum") or raw.get("budget_max")),
        currency=str(currency_code or "USD").upper()[:8],
        project_type=(
            "hourly"
            if str(raw.get("type") or raw.get("project_type") or "fixed").lower() == "hourly"
            else "fixed"
        ),
        skills=skills or list(raw.get("skills") or []),
        bid_count=_int_or_none(bid_stats.get("bid_count") or raw.get("bid_count")),
        bid_avg=_float_or_none(bid_stats.get("bid_avg") or raw.get("bid_avg")),
        employer_verified=_employer_verified(raw, users),
        employer_country=_employer_country(raw, users),
        matched_keyword=matched_keyword,
    )
