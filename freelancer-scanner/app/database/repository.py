"""Alle Datenbankzugriffe an einer Stelle.

Der Rest der Anwendung kennt kein SQL. Das macht den spaeteren Wechsel
auf Supabase/PostgreSQL zu einer reinen Konfigurationsfrage.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project, ProjectStatus, utcnow


class ProjectRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    # -- Lesen ------------------------------------------------------------
    def get(self, project_id: int) -> Project | None:
        return self.session.get(Project, project_id)

    def get_by_freelancer_id(self, freelancer_id: str) -> Project | None:
        return self.session.scalar(
            select(Project).where(Project.freelancer_id == str(freelancer_id))
        )

    def exists(self, freelancer_id: str) -> bool:
        return (
            self.session.scalar(
                select(func.count())
                .select_from(Project)
                .where(Project.freelancer_id == str(freelancer_id))
            )
            or 0
        ) > 0

    def existing_ids(self, freelancer_ids: Sequence[str]) -> set[str]:
        """Dublettenpruefung fuer viele IDs in einer Abfrage."""
        if not freelancer_ids:
            return set()
        wanted = [str(value) for value in freelancer_ids]
        rows = self.session.scalars(
            select(Project.freelancer_id).where(Project.freelancer_id.in_(wanted))
        )
        return set(rows)

    def list_projects(
        self,
        *,
        status: ProjectStatus | None = None,
        min_score: float | None = None,
        include_rejected: bool = False,
        limit: int = 200,
    ) -> list[Project]:
        stmt = select(Project)
        if status is not None:
            stmt = stmt.where(Project.status == status)
        elif not include_rejected:
            stmt = stmt.where(Project.status != ProjectStatus.REJECTED)
        if min_score is not None:
            stmt = stmt.where(Project.overall_score >= min_score)
        stmt = stmt.order_by(
            Project.overall_score.desc().nullslast(), Project.fetched_at.desc()
        ).limit(limit)
        return list(self.session.scalars(stmt))

    def stats_since(self, since: datetime, min_score: float) -> dict[str, Any]:
        """Kennzahlen fuer die Kacheln oben im Dashboard."""
        scored = select(Project).where(
            Project.fetched_at >= since, Project.overall_score.is_not(None)
        )
        scores = [
            value
            for value in self.session.scalars(
                select(Project.overall_score).where(
                    Project.fetched_at >= since, Project.overall_score.is_not(None)
                )
            )
        ]
        found_total = (
            self.session.scalar(
                select(func.count()).select_from(Project).where(Project.fetched_at >= since)
            )
            or 0
        )
        above = [value for value in scores if value >= min_score]
        return {
            "found_today": found_total,
            "above_threshold": len(above),
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "best_score": round(max(scores), 1) if scores else None,
            "evaluated_today": len(scores),
        }

    def count_by_status(self) -> dict[str, int]:
        rows = self.session.execute(
            select(Project.status, func.count()).group_by(Project.status)
        )
        return {status.value: count for status, count in rows}

    # -- Schreiben --------------------------------------------------------
    def add(self, project: Project) -> Project:
        self.session.add(project)
        self.session.flush()
        return project

    def set_status(self, project_id: int, status: ProjectStatus) -> Project | None:
        project = self.get(project_id)
        if project is None:
            return None
        project.status = status
        project.updated_at = utcnow()
        self.session.flush()
        return project

    def mark_notified(self, project_id: int) -> None:
        project = self.get(project_id)
        if project is not None:
            project.notified_at = utcnow()
            self.session.flush()

    def save_proposal(self, project_id: int, proposal_text: str) -> Project | None:
        project = self.get(project_id)
        if project is None:
            return None
        project.proposal_draft = proposal_text
        project.updated_at = utcnow()
        self.session.flush()
        return project


def start_of_today_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def hours_ago(hours: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)
