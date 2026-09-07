"""Aktionen: Status setzen, Entwurf erzeugen, Scan starten.

Alle Aktionen sind bewusst manuell. Es gibt keinen Endpunkt, der eine
Bewerbung versendet oder einen Auftrag annimmt.
"""

from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import RedirectResponse

from app.database.repository import ProjectRepository
from app.database.session import session_scope
from app.llm.client import LLMClient
from app.logging_setup import get_logger
from app.models.evaluation import LLMEvaluation
from app.models.project import ProjectStatus
from app.services.scanner import run_scan

logger = get_logger(__name__)
router = APIRouter()


def _redirect(path: str, message: str) -> RedirectResponse:
    separator = "&" if "?" in path else "?"
    return RedirectResponse(
        url=f"{path}{separator}message={quote(message)}", status_code=303
    )


@router.post("/projects/{project_id}/status")
def set_status(project_id: int, status: str = Form(...)):
    try:
        new_status = ProjectStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unbekannter Status: {status}")

    with session_scope() as session:
        project = ProjectRepository(session).set_status(project_id, new_status)
        if project is None:
            raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
        label = project.status_label

    return _redirect(f"/projects/{project_id}", f"Status gesetzt auf: {label}")


@router.post("/projects/{project_id}/proposal")
def create_proposal(project_id: int):
    """Erzeugt den Bewerbungsentwurf nachtraeglich -- auf Knopfdruck.

    Damit kostet ein Entwurf nur dann Geld, wenn du ihn wirklich willst.
    """
    with session_scope() as session:
        project = ProjectRepository(session).get(project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
        raw_evaluation = project.evaluation

    if not raw_evaluation:
        return _redirect(
            f"/projects/{project_id}",
            "Für dieses Projekt liegt keine KI-Bewertung vor -- ohne sie ist kein "
            "Entwurf möglich.",
        )

    try:
        evaluation = LLMEvaluation.model_validate(raw_evaluation)
        proposal = LLMClient().draft_proposal(project, evaluation)
    except Exception as exc:  # noqa: BLE001
        logger.error("Entwurf fehlgeschlagen: %s", exc)
        return _redirect(f"/projects/{project_id}", f"Entwurf fehlgeschlagen: {exc}")

    with session_scope() as session:
        ProjectRepository(session).save_proposal(project_id, proposal.as_text())

    return _redirect(f"/projects/{project_id}", "Bewerbungsentwurf erstellt.")


@router.post("/scan")
def trigger_scan():
    try:
        report = run_scan()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Scan fehlgeschlagen")
        return _redirect("/", f"Scan fehlgeschlagen: {exc}")

    message = f"Scan abgeschlossen: {report.summary()}."
    if report.errors:
        message += f" {len(report.errors)} Fehler -- Details im Log."
    return _redirect("/", message)
