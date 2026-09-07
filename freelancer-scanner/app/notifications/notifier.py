"""Schnittstelle fuer Benachrichtigungen."""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.evaluation import ScoreResult
from app.models.project import Project


class Notifier(ABC):
    name: str = "base"

    @abstractmethod
    def send_project(
        self, project: Project, score: ScoreResult, proposal_excerpt: str | None = None
    ) -> bool:
        """Meldet ein interessantes Projekt. True = erfolgreich zugestellt."""

    def send_text(self, text: str) -> bool:  # pragma: no cover - optional
        return False
