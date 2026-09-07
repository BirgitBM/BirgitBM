"""Schnittstelle zur Projektquelle.

Zwei Implementierungen: LiveFreelancerClient (echte API) und
DemoFreelancerClient (Beispieldaten). Der Rest der Anwendung kennt
nur diese Schnittstelle -- deshalb laeuft alles auch ohne API-Zugang.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class FreelancerAPIError(RuntimeError):
    """Die Projektquelle war nicht erreichbar oder hat einen Fehler gemeldet."""


class FreelancerClient(ABC):
    name: str = "base"

    @abstractmethod
    def search(self, keyword: str, limit: int = 30) -> list[dict[str, Any]]:
        """Liefert Rohdaten der Projekte zu einem Suchbegriff."""

    def close(self) -> None:  # pragma: no cover - optionaler Aufraeumschritt
        return None
