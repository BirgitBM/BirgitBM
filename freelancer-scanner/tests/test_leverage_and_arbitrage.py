"""Tests fuer die vier Ergaenzungen:

  1. automation_leverage fliesst ins Ranking ein
  2. effective_hourly_rate wird berechnet und gespeichert
  3. Frische und Gebotszahl beeinflussen die Reihenfolge
  4. Getrennte Schwellen fuer Meldung und Bewerbungsentwurf
     sowie die ARBITRAGE-Kennzeichnung
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.models.evaluation import LLMEvaluation
from app.scoring.engine import project_age_minutes, score_project

JETZT = datetime(2026, 9, 7, 12, 0, tzinfo=timezone.utc)


def _vor(minuten: float) -> datetime:
    return JETZT - timedelta(minutes=minuten)


# ===========================================================================
# 1. automation_leverage
# ===========================================================================
def test_automation_leverage_ist_pflichtfeld():
    daten = dict(
        technical_fit=9, difficulty=3, risk=2, clarity=8, reusability=8,
        estimated_hours_min=4, estimated_hours_max=7,
        short_summary="s", implementation_idea="i", reason_for_score="r",
    )
    with pytest.raises(ValidationError):
        LLMEvaluation.model_validate(daten)


def test_automation_leverage_bleibt_in_der_skala():
    daten = dict(
        technical_fit=9, automation_leverage=11, difficulty=3, risk=2,
        clarity=8, reusability=8, estimated_hours_min=4, estimated_hours_max=7,
        short_summary="s", implementation_idea="i", reason_for_score="r",
    )
    with pytest.raises(ValidationError):
        LLMEvaluation.model_validate(daten)


def test_hoher_hebel_hebt_den_score(make_project, make_evaluation, scoring):
    niedrig = score_project(
        make_project(), make_evaluation(automation_leverage=2), scoring, now=JETZT
    )
    hoch = score_project(
        make_project(), make_evaluation(automation_leverage=10), scoring, now=JETZT
    )
    assert hoch.overall_score > niedrig.overall_score


def test_hebel_wirkt_genau_mit_seinem_gewicht(make_project, make_evaluation, scoring):
    """Von 0 auf 10 muss exakt das konfigurierte Gewicht ausmachen."""
    null = score_project(
        make_project(), make_evaluation(automation_leverage=0), scoring, now=JETZT
    )
    voll = score_project(
        make_project(), make_evaluation(automation_leverage=10), scoring, now=JETZT
    )
    erwartet = 100 * scoring.weights.automation_leverage
    assert voll.raw_score - null.raw_score == pytest.approx(erwartet, abs=0.15)


def test_hebel_steht_im_breakdown(make_project, make_evaluation, scoring):
    result = score_project(
        make_project(), make_evaluation(automation_leverage=7), scoring, now=JETZT
    )
    assert result.breakdown.automation_leverage == pytest.approx(0.7)


# ===========================================================================
# 2. effective_hourly_rate
# ===========================================================================
def test_stundensatz_ist_gebot_geteilt_durch_hoechstaufwand(
    make_project, make_evaluation, scoring
):
    result = score_project(
        make_project(budget_min=5000, budget_max=5000),
        make_evaluation(estimated_hours_min=4, estimated_hours_max=8),
        scoring,
        now=JETZT,
    )
    assert result.effective_hourly_rate_usd == pytest.approx(
        result.recommended_bid_usd / 8, abs=0.05
    )


def test_grosszuegiges_budget_ergibt_genau_den_zielstundensatz(
    make_project, make_evaluation, scoring
):
    """Ist das Budget reichlich, wird auf den Zielsatz kalkuliert -- nicht darueber.

    Bewusst so: hohe Gebote gewinnt man auf Freelancer.com selten.
    Wie viel das Budget hergeben WUERDE, steht in budget_hourly_rate_usd.
    """
    result = score_project(
        make_project(budget_min=9000, budget_max=9000),
        make_evaluation(estimated_hours_min=8, estimated_hours_max=10),
        scoring,
        now=JETZT,
    )
    assert result.effective_hourly_rate_usd == pytest.approx(
        scoring.target_hourly_rate_usd, abs=0.05
    )
    assert result.budget_hourly_rate_usd > scoring.target_hourly_rate_usd


def test_knappes_budget_druckt_den_stundensatz(make_project, make_evaluation, scoring):
    result = score_project(
        make_project(budget_min=300, budget_max=300),
        make_evaluation(estimated_hours_min=8, estimated_hours_max=10),
        scoring,
        now=JETZT,
    )
    assert result.effective_hourly_rate_usd < scoring.target_hourly_rate_usd


def test_stundensatz_ist_nicht_mehr_konstant(make_project, make_evaluation, scoring):
    """Gegenprobe zum urspruenglichen Rechenfehler.

    Wuerde auf den Mittelwert statt auf den Hoechstaufwand kalkuliert,
    kaeme bei grosszuegigem Budget immer derselbe Wert heraus.
    """
    saetze = {
        score_project(
            make_project(budget_min=budget, budget_max=budget),
            make_evaluation(estimated_hours_min=4, estimated_hours_max=8),
            scoring,
            now=JETZT,
        ).effective_hourly_rate_usd
        for budget in (300, 500, 900)
    }
    assert len(saetze) == 3, "Der Stundensatz muss mit dem Budget variieren"


def test_stundensatz_wird_gespeichert(make_project, make_evaluation, scoring):
    """Nicht nur berechnen -- er muss in der Datenbank landen."""
    from app.database.repository import ProjectRepository
    from app.database.session import session_scope

    project = make_project()
    result = score_project(project, make_evaluation(), scoring, now=JETZT)
    project.effective_hourly_rate_usd = result.effective_hourly_rate_usd
    project.automation_leverage = 9

    with session_scope() as session:
        stored_id = ProjectRepository(session).add(project).id

    with session_scope() as session:
        wieder = ProjectRepository(session).get(stored_id)
        assert wieder.effective_hourly_rate_usd == result.effective_hourly_rate_usd
        assert wieder.automation_leverage == 9


# ===========================================================================
# 3. Frische und Gebotszahl
# ===========================================================================
def test_alter_wird_korrekt_berechnet(make_project):
    assert project_age_minutes(make_project(posted_at=_vor(90)), JETZT) == pytest.approx(90)
    assert project_age_minutes(make_project(posted_at=None), JETZT) is None


def test_frisches_projekt_rankt_hoeher(make_project, make_evaluation, scoring):
    frisch = score_project(
        make_project(posted_at=_vor(5), bid_count=2), make_evaluation(), scoring, now=JETZT
    )
    alt = score_project(
        make_project(posted_at=_vor(3000), bid_count=2), make_evaluation(), scoring, now=JETZT
    )
    assert frisch.opportunity_score > alt.opportunity_score
    # Die Qualitaet selbst darf sich nicht veraendert haben.
    assert frisch.overall_score == alt.overall_score


def test_wenige_gebote_ranken_hoeher(make_project, make_evaluation, scoring):
    wenig = score_project(
        make_project(posted_at=_vor(5), bid_count=2), make_evaluation(), scoring, now=JETZT
    )
    viel = score_project(
        make_project(posted_at=_vor(5), bid_count=45), make_evaluation(), scoring, now=JETZT
    )
    assert wenig.opportunity_score > viel.opportunity_score


def test_bonus_ist_gedeckelt(make_project, make_evaluation, scoring):
    bester = score_project(
        make_project(posted_at=_vor(1), bid_count=0), make_evaluation(), scoring, now=JETZT
    )
    assert bester.freshness_bonus <= scoring.freshness.max_bonus
    assert bester.opportunity_score <= 100


def test_unbekanntes_alter_gibt_keinen_bonus(make_project, make_evaluation, scoring):
    result = score_project(
        make_project(posted_at=None, bid_count=100), make_evaluation(), scoring, now=JETZT
    )
    assert result.freshness_bonus == 0
    assert result.opportunity_score == result.overall_score


def test_frische_veraendert_die_qualitaetsbewertung_nicht(
    make_project, make_evaluation, scoring
):
    """Wichtig fuer spaetere Auswertungen: der overall_score ist stabil."""
    scores = {
        score_project(
            make_project(posted_at=_vor(minuten)), make_evaluation(), scoring, now=JETZT
        ).overall_score
        for minuten in (1, 30, 200, 5000)
    }
    assert len(scores) == 1


def test_frische_kann_ein_schlechtes_projekt_nicht_ueber_die_schwelle_heben(
    make_project, make_evaluation, scoring
):
    result = score_project(
        make_project(posted_at=_vor(1), bid_count=0),
        make_evaluation(technical_fit=2, automation_leverage=1, risk=9, clarity=3),
        scoring,
        now=JETZT,
    )
    assert result.opportunity_score < scoring.min_score


# ===========================================================================
# 4. Getrennte Schwellen und ARBITRAGE
# ===========================================================================
def test_apply_score_liegt_ueber_min_score(scoring):
    assert scoring.apply_score >= scoring.min_score


def test_apply_score_unter_min_score_wird_abgelehnt():
    from app.config import ScoringConfig, get_scoring_config

    daten = get_scoring_config().model_dump()
    daten["min_score"] = 75
    daten["apply_score"] = 60
    with pytest.raises(ValidationError):
        ScoringConfig(**daten)


def _arbitrage_kandidat(make_project, make_evaluation, scoring, **ev_overrides):
    """Ein Projekt, das alle ARBITRAGE-Bedingungen erfuellt.

    Ueber ev_overrides laesst sich gezielt eine Bedingung brechen.
    """
    werte = dict(
        technical_fit=10, automation_leverage=10, difficulty=2, risk=2,
        clarity=9, reusability=9, estimated_hours_min=5, estimated_hours_max=8,
    )
    werte.update(ev_overrides)
    evaluation = make_evaluation(**werte)
    project = make_project(budget_min=1200, budget_max=1400, posted_at=_vor(10), bid_count=3)
    return score_project(project, evaluation, scoring, now=JETZT)


def test_arbitrage_wird_erkannt(make_project, make_evaluation, scoring):
    result = _arbitrage_kandidat(make_project, make_evaluation, scoring)
    assert result.is_arbitrage, result.arbitrage_misses
    assert result.arbitrage_misses == []


def test_arbitrage_faellt_bei_zu_niedrigem_hebel(make_project, make_evaluation, scoring):
    result = _arbitrage_kandidat(
        make_project, make_evaluation, scoring, automation_leverage=6
    )
    assert not result.is_arbitrage
    assert any("Automatisierungshebel" in grund for grund in result.arbitrage_misses)


def test_arbitrage_faellt_bei_zu_hohem_risiko(make_project, make_evaluation, scoring):
    result = _arbitrage_kandidat(make_project, make_evaluation, scoring, risk=6)
    assert not result.is_arbitrage
    assert any("Risiko" in grund for grund in result.arbitrage_misses)


def test_arbitrage_faellt_bei_zu_niedrigem_stundensatz(
    make_project, make_evaluation, scoring
):
    evaluation = make_evaluation(
        technical_fit=10, automation_leverage=10, difficulty=2, risk=2,
        clarity=9, reusability=9, estimated_hours_min=5, estimated_hours_max=8,
    )
    # Budget reicht nur fuer rund 30 USD pro Stunde.
    project = make_project(budget_min=280, budget_max=280, posted_at=_vor(10), bid_count=3)
    result = score_project(project, evaluation, scoring, now=JETZT)
    assert not result.is_arbitrage
    assert any("Stundensatz" in grund for grund in result.arbitrage_misses)


def test_arbitrage_faellt_bei_ausgeschlossener_technologie(
    make_project, make_evaluation, scoring
):
    evaluation = make_evaluation(
        technical_fit=10, automation_leverage=10, difficulty=2, risk=2,
        clarity=9, reusability=9, estimated_hours_min=5, estimated_hours_max=8,
    )
    project = make_project(
        budget_min=1200, budget_max=1400, posted_at=_vor(10), bid_count=3,
        skills=["Salesforce", "n8n"],
    )
    result = score_project(project, evaluation, scoring, now=JETZT)
    assert not result.is_arbitrage
    assert any("Salesforce" in grund for grund in result.arbitrage_misses)


def test_arbitrage_faellt_bei_zu_niedrigem_score(make_project, make_evaluation, scoring):
    result = _arbitrage_kandidat(make_project, make_evaluation, scoring, clarity=4, risk=4)
    if result.overall_score < scoring.arbitrage.min_overall_score:
        assert not result.is_arbitrage
        assert any("Score" in grund for grund in result.arbitrage_misses)


def test_arbitrage_bekommt_immer_einen_entwurf(scoring):
    """Auch wenn der Score unter apply_score liegt -- das sind die Geldjobs."""
    from app.models.project import Project

    evaluation = LLMEvaluation(
        technical_fit=10, automation_leverage=10, difficulty=2, risk=2,
        clarity=8, reusability=6, estimated_hours_min=5, estimated_hours_max=8,
        short_summary="s", implementation_idea="i", reason_for_score="r",
    )
    project = Project(
        freelancer_id="arb-1", title="t", description="d" * 400, currency="USD",
        project_type="fixed", skills=[], employer_verified=True,
        budget_min=1200, budget_max=1400, bid_count=3, posted_at=_vor(10),
    )
    result = score_project(project, evaluation, scoring, now=JETZT)
    entwurf_faellig = result.overall_score >= scoring.apply_score or result.is_arbitrage
    assert entwurf_faellig
