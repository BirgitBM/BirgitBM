"""Scoring-Engine.

Grundsatz: Das LLM schaetzt, Python rechnet.

Konservative Auslegung -- ein attraktives Budget kann ein technisch
riskantes Projekt NICHT hochziehen. Dafuer sorgen zwei Mechanismen:

  1. Die Budget-Komponente ist bei 1.0 gedeckelt und macht nur 20 % aus.
  2. Harte Deckel: Risiko, Schwierigkeit, Unklarheit und Warnsignale
     begrenzen den Endscore unabhaengig von allen anderen Kriterien.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.config import ExcludeConfig, ScoringConfig, get_exclude_config, get_scoring_config
from app.logging_setup import get_logger
from app.models.evaluation import (
    LLMEvaluation,
    RiskLevel,
    ScoreBreakdown,
    ScoreResult,
)
from app.models.project import Project

logger = get_logger(__name__)

# Ein Budget in Hoehe des Ziel-Stundensatzes ergibt 0.5 Punkte.
# Erst das 1.5-fache ergibt die volle Punktzahl, das 0.5-fache ergibt 0.
BUDGET_LOWER_RATIO = 0.5
BUDGET_UPPER_RATIO = 1.5

# Wenn kein Budget bekannt ist: bewusst unterhalb der Mitte, damit
# fehlende Angaben nicht belohnt werden.
BUDGET_UNKNOWN_SCORE = 0.35

# Anteil des geschaetzten Budgets, den das empfohlene Gebot ausmacht.
BID_FACTOR = 0.85


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def to_usd(amount: float | None, currency: str, config: ScoringConfig) -> float | None:
    """Rechnet einen Betrag naeherungsweise in USD um."""
    if amount is None:
        return None
    rate = config.currency_rates_usd.get((currency or "USD").upper())
    if rate is None:
        logger.warning(
            "Kein Umrechnungskurs fuer '%s' hinterlegt -- Betrag wird als USD behandelt.",
            currency,
        )
        rate = 1.0
    return amount * rate


def budget_mid_usd(project: Project, config: ScoringConfig) -> float | None:
    """Mittleres Projektbudget in USD. Bei Stundenprojekten hochgerechnet."""
    low = to_usd(project.budget_min, project.currency, config)
    high = to_usd(project.budget_max, project.currency, config)
    values = [value for value in (low, high) if value is not None and value > 0]
    if not values:
        return None
    return sum(values) / len(values)


def _budget_component(
    project: Project, evaluation: LLMEvaluation, config: ScoringConfig
) -> tuple[float, float | None, list[str]]:
    """Bewertet das Verhaeltnis von Budget zu geschaetztem Aufwand.

    Rueckgabe: (Teilscore 0-1, Stundensatz laut Kundenbudget, Hinweise)

    Achtung, zwei verschiedene Kennzahlen:
      - der Wert hier ist, was das KUNDENBUDGET pro Stunde hergibt
      - effective_hourly_rate_usd weiter unten ist, was DU verdienst
    """
    notes: list[str] = []
    hours = evaluation.hours_mid
    if hours <= 0:
        notes.append("Aufwandsschaetzung fehlt oder ist null -- Budgetbewertung neutral.")
        return BUDGET_UNKNOWN_SCORE, None, notes

    budget = budget_mid_usd(project, config)
    if budget is None:
        notes.append("Kein Budget angegeben -- Budgetbewertung abgewertet.")
        return BUDGET_UNKNOWN_SCORE, None, notes

    if project.project_type == "hourly":
        # Bei Stundenprojekten ist das Budget bereits ein Stundensatz.
        effective_rate = budget
    else:
        net_budget = max(budget - evaluation.estimated_tool_cost_usd, 0.0)
        if net_budget <= 0:
            notes.append("Werkzeugkosten fressen das Budget vollstaendig auf.")
            return 0.0, 0.0, notes
        effective_rate = net_budget / hours

    ratio = effective_rate / config.target_hourly_rate_usd
    span = BUDGET_UPPER_RATIO - BUDGET_LOWER_RATIO
    component = _clamp((ratio - BUDGET_LOWER_RATIO) / span)

    if effective_rate < config.target_hourly_rate_usd:
        notes.append(
            f"Effektiver Stundensatz {effective_rate:.0f} USD liegt unter dem Ziel "
            f"von {config.target_hourly_rate_usd:.0f} USD."
        )
    return component, effective_rate, notes


def _recommended_bid(
    project: Project, evaluation: LLMEvaluation, config: ScoringConfig
) -> float | None:
    """Gebotsempfehlung: der niedrigere Wert aus Budgetanteil und Aufwandskalkulation.

    Kalkuliert wird bewusst auf die OBERE Aufwandsschaetzung, nicht auf den
    Mittelwert. Zwei Gruende:

      1. Konservativ: Du erreichst deinen Zielstundensatz auch dann noch,
         wenn die pessimistische Schaetzung eintritt.
      2. Ohne das waere effective_hourly_rate (Gebot geteilt durch hours_max)
         eine Konstante und damit als Kennzahl wertlos.
    """
    hours = evaluation.estimated_hours_max
    cost_based = None
    if hours > 0:
        cost_based = hours * config.target_hourly_rate_usd + evaluation.estimated_tool_cost_usd

    budget = budget_mid_usd(project, config)
    budget_based = budget * BID_FACTOR if budget is not None else None

    if project.project_type == "hourly":
        # Bei Stundenprojekten ist das "Gebot" der Stundensatz selbst.
        return round(max(config.target_hourly_rate_usd, budget or 0.0), 2)

    candidates = [value for value in (cost_based, budget_based) if value is not None]
    if not candidates:
        return None
    return round(min(candidates), 2)


def _apply_caps(
    raw_score: float,
    project: Project,
    evaluation: LLMEvaluation,
    config: ScoringConfig,
) -> tuple[float, list[str]]:
    """Konservative Deckel. Ein Deckel begrenzt den Score hart nach oben."""
    caps = config.caps
    applied: list[str] = []
    score = raw_score

    def apply(limit: float, label: str) -> None:
        nonlocal score
        if score > limit:
            score = limit
            applied.append(label)

    if evaluation.risk >= caps.risk_critical.threshold:
        apply(
            caps.risk_critical.max_score,
            f"Sehr hohes technisches Risiko ({evaluation.risk:.0f}/10)",
        )
    elif evaluation.risk >= caps.risk_high.threshold:
        apply(
            caps.risk_high.max_score,
            f"Hohes technisches Risiko ({evaluation.risk:.0f}/10)",
        )

    if evaluation.clarity <= caps.clarity_low.threshold:
        apply(
            caps.clarity_low.max_score,
            f"Aufgabenstellung sehr unklar ({evaluation.clarity:.0f}/10)",
        )

    if evaluation.difficulty >= caps.difficulty_high.threshold:
        apply(
            caps.difficulty_high.max_score,
            f"Hohe Umsetzungsschwierigkeit ({evaluation.difficulty:.0f}/10)",
        )

    if len(evaluation.red_flags) >= caps.many_red_flags.threshold:
        apply(
            caps.many_red_flags.max_score,
            f"{len(evaluation.red_flags)} Warnsignale im Projekttext",
        )

    if project.employer_verified is False:
        apply(
            caps.employer_unverified.max_score,
            "Auftraggeber ohne verifizierte Zahlungsmethode",
        )

    if budget_mid_usd(project, config) is None:
        apply(caps.no_budget.max_score, "Kein Budget angegeben")

    return score, applied


def project_age_minutes(project: Project, now: datetime | None = None) -> float | None:
    """Alter des Projekts seit Veroeffentlichung in Minuten."""
    if project.posted_at is None:
        return None
    reference = now or datetime.now(timezone.utc)
    posted = project.posted_at
    if posted.tzinfo is None:
        posted = posted.replace(tzinfo=timezone.utc)
    return max((reference - posted).total_seconds() / 60.0, 0.0)


def _freshness_bonus(
    project: Project, config: ScoringConfig, now: datetime | None = None
) -> tuple[float, float | None, list[str]]:
    """Bonuspunkte fuer frische Projekte mit wenigen Geboten.

    Fliesst NICHT in den overall_score ein -- nur in den opportunity_score,
    nach dem sortiert und gemeldet wird. Sonst wuerde sich die Bewertung
    eines Projekts im Zeitverlauf aendern und spaetere Auswertungen
    waeren nicht mehr vergleichbar.
    """
    notes: list[str] = []
    rules = config.freshness
    age = project_age_minutes(project, now)

    if age is None:
        age_bonus = rules.unknown_age_bonus
        notes.append("Veroeffentlichungszeit unbekannt -- kein Altersbonus.")
    else:
        age_bonus = 0.0
        for rule in sorted(rules.age_bonus, key=lambda item: item.max_minutes):
            if age <= rule.max_minutes:
                age_bonus = rule.bonus
                break

    bid_bonus = 0.0
    if project.bid_count is not None:
        for rule in sorted(rules.bid_bonus, key=lambda item: item.max_bids):
            if project.bid_count <= rule.max_bids:
                bid_bonus = rule.bonus
                break

    total = age_bonus + bid_bonus
    if total > 0:
        parts = []
        if age_bonus:
            parts.append(f"frisch (+{age_bonus:.0f})")
        if bid_bonus:
            parts.append(f"wenige Gebote (+{bid_bonus:.0f})")
        notes.append("Frischebonus: " + ", ".join(parts))

    return total, age, notes


def _check_arbitrage(
    project: Project,
    evaluation: LLMEvaluation,
    overall_score: float,
    effective_rate: float | None,
    config: ScoringConfig,
    excludes: ExcludeConfig | None = None,
) -> tuple[bool, list[str]]:
    """Kennzeichnet Projekte, bei denen sich das Geschaeftsmodell rechnet.

    Alle Bedingungen muessen erfuellt sein. Rueckgabe: (ja/nein, was fehlte).
    """
    rules = config.arbitrage
    misses: list[str] = []

    if overall_score < rules.min_overall_score:
        misses.append(
            f"Score {overall_score:.0f} unter {rules.min_overall_score:.0f}"
        )
    if evaluation.automation_leverage < rules.min_automation_leverage:
        misses.append(
            f"Automatisierungshebel {evaluation.automation_leverage:.0f} "
            f"unter {rules.min_automation_leverage:.0f}"
        )
    if evaluation.risk > rules.max_risk:
        misses.append(f"Risiko {evaluation.risk:.0f} ueber {rules.max_risk:.0f}")
    if effective_rate is None:
        misses.append("Stundensatz nicht berechenbar")
    elif effective_rate < rules.min_effective_hourly_rate_usd:
        misses.append(
            f"Stundensatz {effective_rate:.0f} USD unter "
            f"{rules.min_effective_hourly_rate_usd:.0f} USD"
        )

    # Sicherheitsnetz: exclude.yaml kann sich geaendert haben, seit das
    # Projekt den Vorfilter passiert hat.
    excludes = excludes or get_exclude_config()
    haystack = " ".join(
        [project.title or "", project.description or "", " ".join(project.skills or [])]
    ).lower()
    for technology in excludes.exclude_technologies:
        if technology.lower() in haystack:
            misses.append(f"Ausgeschlossene Technologie: {technology}")
            break

    return not misses, misses


def _category(score: float, config: ScoringConfig) -> str:
    if score >= config.min_score:
        return "A"
    if score >= 60:
        return "B"
    return "C"


def score_project(
    project: Project,
    evaluation: LLMEvaluation,
    config: ScoringConfig | None = None,
    now: datetime | None = None,
) -> ScoreResult:
    """Berechnet den Gesamtscore aus der KI-Einschaetzung und den Projektdaten."""
    config = config or get_scoring_config()
    weights = config.weights

    budget_component, budget_rate, notes = _budget_component(project, evaluation, config)

    breakdown = ScoreBreakdown(
        technical_fit=evaluation.technical_fit / 10,
        automation_leverage=evaluation.automation_leverage / 10,
        budget_ratio=budget_component,
        clarity=evaluation.clarity / 10,
        risk=(10 - evaluation.risk) / 10,
        simplicity=(10 - evaluation.difficulty) / 10,
        reusability=evaluation.reusability / 10,
    )

    raw_score = 100 * (
        weights.technical_fit * breakdown.technical_fit
        + weights.automation_leverage * breakdown.automation_leverage
        + weights.budget_ratio * breakdown.budget_ratio
        + weights.clarity * breakdown.clarity
        + weights.risk * breakdown.risk
        + weights.simplicity * breakdown.simplicity
        + weights.reusability * breakdown.reusability
    )

    overall_score, applied_caps = _apply_caps(raw_score, project, evaluation, config)
    overall_score = round(overall_score, 1)

    recommended_bid = _recommended_bid(project, evaluation, config)

    # Was du tatsaechlich pro Stunde verdienst, wenn die obere
    # Aufwandsschaetzung eintritt. Bewusst der pessimistische Fall.
    effective_rate: float | None = None
    if recommended_bid is not None:
        if project.project_type == "hourly":
            effective_rate = recommended_bid
        elif evaluation.estimated_hours_max > 0:
            effective_rate = round(
                recommended_bid / evaluation.estimated_hours_max, 2
            )

    freshness_bonus, age_minutes, freshness_notes = _freshness_bonus(project, config, now)
    notes.extend(freshness_notes)

    # Der Frischebonus veraendert den overall_score nicht -- nur die
    # Dringlichkeit, mit der das Projekt angezeigt und gemeldet wird.
    opportunity_score = round(min(100.0, overall_score + freshness_bonus), 1)

    is_arbitrage, arbitrage_misses = _check_arbitrage(
        project, evaluation, overall_score, effective_rate, config
    )

    return ScoreResult(
        overall_score=overall_score,
        opportunity_score=opportunity_score,
        raw_score=round(raw_score, 1),
        category=_category(overall_score, config),
        risk_level=RiskLevel.from_value(evaluation.risk),
        recommended_bid_usd=recommended_bid,
        effective_hourly_rate_usd=effective_rate,
        budget_hourly_rate_usd=round(budget_rate, 2) if budget_rate else None,
        freshness_bonus=freshness_bonus,
        age_minutes=round(age_minutes, 1) if age_minutes is not None else None,
        is_arbitrage=is_arbitrage,
        arbitrage_misses=arbitrage_misses,
        breakdown=breakdown,
        applied_caps=applied_caps,
        notes=notes,
    )
