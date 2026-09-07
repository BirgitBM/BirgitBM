"""Datenbanktabelle fuer gefundene Projekte."""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ProjectStatus(str, enum.Enum):
    NEW = "NEW"
    INTERESTING = "INTERESTING"
    REJECTED = "REJECTED"
    APPLIED = "APPLIED"
    WON = "WON"
    LOST = "LOST"


# Reihenfolge und Beschriftung fuer das Dashboard
STATUS_LABELS: dict[ProjectStatus, str] = {
    ProjectStatus.NEW: "Neu",
    ProjectStatus.INTERESTING: "Interessant",
    ProjectStatus.REJECTED: "Abgelehnt",
    ProjectStatus.APPLIED: "Beworben",
    ProjectStatus.WON: "Gewonnen",
    ProjectStatus.LOST: "Verloren",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # --- Rohdaten von Freelancer ----------------------------------------
    # freelancer_id ist eindeutig und damit der Dublettenschutz.
    freelancer_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(1000), default="")
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    budget_min: Mapped[float | None] = mapped_column(Float)
    budget_max: Mapped[float | None] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    project_type: Mapped[str] = mapped_column(String(32), default="fixed")  # fixed | hourly
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    bid_count: Mapped[int | None] = mapped_column(Integer)
    bid_avg: Mapped[float | None] = mapped_column(Float)
    employer_verified: Mapped[bool | None] = mapped_column(Boolean)
    employer_country: Mapped[str | None] = mapped_column(String(120))
    matched_keyword: Mapped[str | None] = mapped_column(String(120))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # --- Bewertung -------------------------------------------------------
    overall_score: Mapped[float | None] = mapped_column(Float, index=True)
    # Qualitaet plus Frischebonus -- danach wird sortiert und gemeldet.
    opportunity_score: Mapped[float | None] = mapped_column(Float, index=True)
    category: Mapped[str | None] = mapped_column(String(2))
    risk_level: Mapped[str | None] = mapped_column(String(16))
    recommended_bid_usd: Mapped[float | None] = mapped_column(Float)
    # Verdienst pro Stunde bei oberer Aufwandsschaetzung. Wird gespeichert,
    # damit spaeter auswertbar ist, welche Auftragsarten sich lohnen.
    effective_hourly_rate_usd: Mapped[float | None] = mapped_column(Float)
    budget_hourly_rate_usd: Mapped[float | None] = mapped_column(Float)
    automation_leverage: Mapped[float | None] = mapped_column(Float)
    freshness_bonus: Mapped[float | None] = mapped_column(Float)
    age_minutes: Mapped[float | None] = mapped_column(Float)
    is_arbitrage: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    estimated_hours_min: Mapped[float | None] = mapped_column(Float)
    estimated_hours_max: Mapped[float | None] = mapped_column(Float)
    evaluation: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    score_breakdown: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    proposal_draft: Mapped[str | None] = mapped_column(Text)

    # --- Betriebsdaten ---------------------------------------------------
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(ProjectStatus, native_enum=False, length=16),
        default=ProjectStatus.NEW,
        index=True,
    )
    rejected_reason: Mapped[str | None] = mapped_column(String(500))
    evaluation_error: Mapped[str | None] = mapped_column(String(1000))
    llm_provider: Mapped[str | None] = mapped_column(String(32))
    llm_model: Mapped[str | None] = mapped_column(String(120))
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    # --- Hilfsmethoden fuer die Anzeige ---------------------------------
    @property
    def budget_display(self) -> str:
        if self.budget_min is None and self.budget_max is None:
            return "kein Budget angegeben"
        suffix = "/h" if self.project_type == "hourly" else ""
        if self.budget_min is not None and self.budget_max is not None:
            if self.budget_min == self.budget_max:
                return f"{self.budget_min:,.0f} {self.currency}{suffix}"
            return f"{self.budget_min:,.0f}–{self.budget_max:,.0f} {self.currency}{suffix}"
        single = self.budget_min if self.budget_min is not None else self.budget_max
        return f"{single:,.0f} {self.currency}{suffix}"

    @property
    def hours_display(self) -> str:
        if self.estimated_hours_min is None or self.estimated_hours_max is None:
            return "–"
        if self.estimated_hours_min == self.estimated_hours_max:
            return f"{self.estimated_hours_min:.0f} h"
        return f"{self.estimated_hours_min:.0f}–{self.estimated_hours_max:.0f} h"

    @property
    def rate_display(self) -> str:
        if self.effective_hourly_rate_usd is None:
            return "–"
        return f"{self.effective_hourly_rate_usd:,.0f} USD/h"

    @property
    def age_display(self) -> str:
        if self.age_minutes is None:
            return "–"
        if self.age_minutes < 60:
            return f"vor {self.age_minutes:.0f} Min."
        if self.age_minutes < 1440:
            return f"vor {self.age_minutes / 60:.0f} Std."
        return f"vor {self.age_minutes / 1440:.0f} Tagen"

    @property
    def status_label(self) -> str:
        return STATUS_LABELS.get(self.status, self.status.value)

    @property
    def tools_display(self) -> str:
        tools = (self.evaluation or {}).get("required_tools") or []
        return ", ".join(tools[:4]) if tools else "–"

    def __repr__(self) -> str:  # pragma: no cover - nur fuer die Fehlersuche
        return f"<Project {self.freelancer_id} score={self.overall_score} {self.status}>"
