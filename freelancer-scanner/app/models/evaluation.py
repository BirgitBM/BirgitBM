"""Schema fuer die KI-Antwort und das Ergebnis der Scoring-Engine.

Die KI liefert ausschliesslich Einschaetzungen (0-10, Stunden, Texte).
Den eigentlichen Gesamtscore berechnet die Scoring-Engine in Python --
nachvollziehbar, testbar und ohne Prompt-Aenderung anpassbar.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class RiskLevel(str, Enum):
    LOW = "niedrig"
    MEDIUM = "mittel"
    HIGH = "hoch"

    @classmethod
    def from_value(cls, risk_0_10: float) -> "RiskLevel":
        if risk_0_10 <= 3:
            return cls.LOW
        if risk_0_10 <= 6:
            return cls.MEDIUM
        return cls.HIGH


class LLMEvaluation(BaseModel):
    """Genau das, was das LLM zurueckgeben muss. Wird streng validiert."""

    model_config = {"extra": "ignore"}

    technical_fit: float = Field(ge=0, le=10)
    # Wie stark KI, n8n, Make, Zapier oder generierter Code die manuelle
    # Arbeit tatsaechlich ersetzen -- der Hebel des Geschaeftsmodells.
    automation_leverage: float = Field(ge=0, le=10)
    difficulty: float = Field(ge=0, le=10)
    risk: float = Field(ge=0, le=10)
    clarity: float = Field(ge=0, le=10)
    reusability: float = Field(ge=0, le=10)

    estimated_hours_min: float = Field(ge=0, le=2000)
    estimated_hours_max: float = Field(ge=0, le=2000)
    estimated_tool_cost_usd: float = Field(ge=0, le=100000, default=0)

    required_tools: list[str] = Field(default_factory=list)
    required_apis: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)

    short_summary: str = Field(min_length=1, max_length=2000)
    implementation_idea: str = Field(min_length=1, max_length=6000)
    reason_for_score: str = Field(min_length=1, max_length=4000)

    @field_validator("estimated_hours_max")
    @classmethod
    def _max_not_below_min(cls, value: float, info) -> float:
        minimum = info.data.get("estimated_hours_min")
        if minimum is not None and value < minimum:
            # Vertauschte Werte still korrigieren statt die ganze Antwort zu verwerfen.
            return minimum
        return value

    @field_validator("required_tools", "required_apis", "red_flags", mode="before")
    @classmethod
    def _coerce_list(cls, value):
        """Manche Modelle liefern einen String statt einer Liste."""
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            return [stripped] if stripped else []
        return value

    @property
    def hours_mid(self) -> float:
        return (self.estimated_hours_min + self.estimated_hours_max) / 2


class ScoreBreakdown(BaseModel):
    """Wie der Gesamtscore zustande kam -- fuer die Detailseite."""

    technical_fit: float
    automation_leverage: float
    budget_ratio: float
    clarity: float
    risk: float
    simplicity: float
    reusability: float


class ScoreResult(BaseModel):
    """Ergebnis der Scoring-Engine.

    Zwei Kennzahlen mit unterschiedlichem Zweck:

      overall_score      Qualitaetsurteil. Aendert sich nie wieder, damit
                         spaetere Auswertungen vergleichbar bleiben.
      opportunity_score  overall_score plus Frischebonus. Nur fuer die
                         Reihenfolge im Dashboard und die Benachrichtigung --
                         denn ein guter Job von gestern ist meist vergeben.
    """

    overall_score: float
    opportunity_score: float
    raw_score: float
    category: str  # A | B | C
    risk_level: RiskLevel

    recommended_bid_usd: float | None = None
    # Was du pro Stunde verdienst, wenn die OBERE Aufwandsschaetzung eintritt.
    effective_hourly_rate_usd: float | None = None
    # Was das Kundenbudget pro Stunde hergibt (Grundlage der Budget-Bewertung).
    budget_hourly_rate_usd: float | None = None

    freshness_bonus: float = 0.0
    age_minutes: float | None = None

    is_arbitrage: bool = False
    arbitrage_misses: list[str] = Field(default_factory=list)

    breakdown: ScoreBreakdown
    applied_caps: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class Proposal(BaseModel):
    """Bewerbungsentwurf. Wird nie automatisch versendet."""

    model_config = {"extra": "ignore"}

    opening: str = Field(min_length=1, max_length=1500)
    understanding: str = Field(min_length=1, max_length=2500)
    solution_steps: list[str] = Field(min_length=1, max_length=12)
    deliverables: list[str] = Field(default_factory=list)
    timeline: str = Field(default="", max_length=800)
    questions: list[str] = Field(default_factory=list)
    closing: str = Field(default="", max_length=1000)

    @field_validator("solution_steps", "deliverables", "questions", mode="before")
    @classmethod
    def _coerce_list(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            return [stripped] if stripped else []
        return value

    def as_text(self) -> str:
        """Fertiger Fliesstext zum Kopieren in das Freelancer-Bewerbungsfeld."""
        parts: list[str] = [self.opening.strip(), "", self.understanding.strip(), ""]

        parts.append("How I would build it:")
        for index, step in enumerate(self.solution_steps, start=1):
            parts.append(f"{index}. {step.strip()}")

        if self.deliverables:
            parts.extend(["", "What you get:"])
            parts.extend(f"- {item.strip()}" for item in self.deliverables)

        if self.timeline:
            parts.extend(["", f"Timeline: {self.timeline.strip()}"])

        if self.questions:
            parts.extend(["", "Two things I need from you to start:"])
            parts.extend(f"- {item.strip()}" for item in self.questions)

        if self.closing:
            parts.extend(["", self.closing.strip()])

        return "\n".join(parts).strip()
