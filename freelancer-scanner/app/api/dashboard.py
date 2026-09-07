"""Weboberflaeche: Uebersicht und Detailseite."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.config import BASE_DIR, get_scoring_config, get_settings
from app.database.repository import ProjectRepository, start_of_today_utc
from app.database.session import session_scope
from app.models.project import STATUS_LABELS, ProjectStatus

router = APIRouter()
templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))

STATUS_OPTIONS = [(status.value, label) for status, label in STATUS_LABELS.items()]

BREAKDOWN_LABELS = [
    ("technical_fit", "Technische Eignung", 0.30),
    ("budget_ratio", "Budget / Aufwand", 0.20),
    ("clarity", "Klarheit", 0.15),
    ("risk", "Geringes Risiko", 0.15),
    ("simplicity", "Wenig Sonderprogrammierung", 0.10),
    ("reusability", "Wiederverwendbarkeit", 0.10),
]


def _page_info() -> dict:
    settings = get_settings()
    scoring = get_scoring_config()
    return {
        "demo_mode": settings.demo_mode,
        "llm_provider": settings.effective_llm_provider,
        "source": "Demo-Daten" if settings.demo_mode else "Freelancer API",
        "min_score": scoring.min_score,
    }


@router.get("/", response_class=HTMLResponse)
def dashboard(request: Request, filter: str | None = None, message: str | None = None):
    scoring = get_scoring_config()

    status = None
    min_score = None
    if filter == "top":
        min_score = scoring.min_score
    elif filter:
        try:
            status = ProjectStatus(filter)
        except ValueError:
            status = None

    with session_scope() as session:
        repository = ProjectRepository(session)
        projects = repository.list_projects(status=status, min_score=min_score)
        stats = repository.stats_since(start_of_today_utc(), scoring.min_score)

    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {
            "projects": projects,
            "stats": stats,
            "info": _page_info(),
            "status_options": STATUS_OPTIONS,
            "current_filter": filter,
            "message": message,
        },
    )


@router.get("/projects/{project_id}", response_class=HTMLResponse)
def project_detail(request: Request, project_id: int, message: str | None = None):
    with session_scope() as session:
        project = ProjectRepository(session).get(project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="Projekt nicht gefunden")

    return templates.TemplateResponse(
        request,
        "detail.html",
        {
            "project": project,
            "evaluation": project.evaluation,
            "breakdown": project.score_breakdown,
            "breakdown_labels": BREAKDOWN_LABELS,
            "info": _page_info(),
            "status_options": STATUS_OPTIONS,
            "message": message,
        },
    )


@router.get("/health")
def health():
    settings = get_settings()
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "llm_provider": settings.effective_llm_provider,
    }
