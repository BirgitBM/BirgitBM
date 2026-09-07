"""Die Scoring-Engine muss rechnen wie beschrieben -- und konservativ bleiben."""

from __future__ import annotations

import pytest

from app.models.evaluation import RiskLevel
from app.scoring.engine import score_project


def test_guter_automationsjob_kommt_ueber_den_mindestscore(
    make_project, make_evaluation, scoring
):
    result = score_project(make_project(), make_evaluation(), scoring)
    assert result.overall_score >= scoring.min_score
    assert result.category == "A"
    assert result.risk_level is RiskLevel.LOW


def test_gewichtung_ergibt_den_erwarteten_rohwert(make_project, make_evaluation, scoring):
    """Handgerechnetes Gegenbeispiel: alle Teilwerte auf 100 Prozent."""
    project = make_project(budget_min=2000, budget_max=2000)  # sehr grosszuegig
    evaluation = make_evaluation(
        technical_fit=10, difficulty=0, risk=0, clarity=10, reusability=10
    )
    result = score_project(project, evaluation, scoring)
    assert result.raw_score == pytest.approx(100.0, abs=0.1)


def test_hohes_budget_zieht_riskantes_projekt_nicht_hoch(
    make_project, make_evaluation, scoring
):
    """Kernanforderung: Geld darf Risiko nicht ueberstimmen."""
    project = make_project(budget_min=20000, budget_max=30000)
    evaluation = make_evaluation(risk=8, estimated_hours_min=20, estimated_hours_max=30)

    result = score_project(project, evaluation, scoring)

    assert result.overall_score <= scoring.caps.risk_high.max_score
    assert result.overall_score < result.raw_score
    assert any("Risiko" in cap for cap in result.applied_caps)


def test_sehr_hohes_risiko_deckelt_noch_haerter(make_project, make_evaluation, scoring):
    result = score_project(make_project(), make_evaluation(risk=9), scoring)
    assert result.overall_score <= scoring.caps.risk_critical.max_score


def test_unklare_beschreibung_wird_gedeckelt(make_project, make_evaluation, scoring):
    result = score_project(
        make_project(budget_min=5000, budget_max=6000), make_evaluation(clarity=2), scoring
    )
    assert result.overall_score <= scoring.caps.clarity_low.max_score
    assert any("unklar" in cap.lower() for cap in result.applied_caps)


def test_hohe_schwierigkeit_wird_gedeckelt(make_project, make_evaluation, scoring):
    result = score_project(make_project(), make_evaluation(difficulty=9), scoring)
    assert result.overall_score <= scoring.caps.difficulty_high.max_score


def test_viele_warnsignale_werden_gedeckelt(make_project, make_evaluation, scoring):
    result = score_project(
        make_project(), make_evaluation(red_flags=["a", "b", "c"]), scoring
    )
    assert result.overall_score <= scoring.caps.many_red_flags.max_score


def test_nicht_verifizierter_auftraggeber_wird_gedeckelt(
    make_project, make_evaluation, scoring
):
    result = score_project(make_project(employer_verified=False), make_evaluation(), scoring)
    assert result.overall_score <= scoring.caps.employer_unverified.max_score


def test_fehlendes_budget_wird_abgewertet_nicht_belohnt(
    make_project, make_evaluation, scoring
):
    mit_budget = score_project(make_project(), make_evaluation(), scoring)
    ohne_budget = score_project(
        make_project(budget_min=None, budget_max=None), make_evaluation(), scoring
    )
    assert ohne_budget.overall_score < mit_budget.overall_score
    assert ohne_budget.overall_score <= scoring.caps.no_budget.max_score


def test_schlechtes_stundenverhaeltnis_senkt_den_score(
    make_project, make_evaluation, scoring
):
    """400 USD fuer 5 Stunden ist gut, 400 USD fuer 60 Stunden ist es nicht."""
    gut = score_project(make_project(), make_evaluation(), scoring)
    schlecht = score_project(
        make_project(),
        make_evaluation(estimated_hours_min=50, estimated_hours_max=70),
        scoring,
    )
    assert schlecht.overall_score < gut.overall_score
    assert schlecht.effective_hourly_rate_usd < scoring.target_hourly_rate_usd


def test_waehrung_wird_umgerechnet(make_project, make_evaluation, scoring):
    """500 EUR sind mehr wert als 500 USD -- das muss sich im Score zeigen."""
    usd = score_project(
        make_project(budget_min=300, budget_max=300, currency="USD"),
        make_evaluation(),
        scoring,
    )
    eur = score_project(
        make_project(budget_min=300, budget_max=300, currency="EUR"),
        make_evaluation(),
        scoring,
    )
    assert eur.effective_hourly_rate_usd > usd.effective_hourly_rate_usd


def test_gebotsempfehlung_bleibt_unter_dem_budget(make_project, make_evaluation, scoring):
    project = make_project(budget_min=400, budget_max=600)
    result = score_project(project, make_evaluation(), scoring)
    assert result.recommended_bid_usd is not None
    assert result.recommended_bid_usd <= 600


def test_gebotsempfehlung_deckt_mindestens_die_eigenen_kosten_oder_liegt_darunter(
    make_project, make_evaluation, scoring
):
    """Bei knappem Budget wird das Gebot konservativ nach unten gezogen."""
    project = make_project(budget_min=200, budget_max=200)
    result = score_project(
        project, make_evaluation(estimated_hours_min=10, estimated_hours_max=10), scoring
    )
    # min(Kostenkalkulation 600, Budgetanteil 170) -> 170
    assert result.recommended_bid_usd == pytest.approx(170.0, abs=0.5)


def test_score_bleibt_in_den_grenzen(make_project, make_evaluation, scoring):
    schlechtest = score_project(
        make_project(budget_min=50, budget_max=50, employer_verified=False),
        make_evaluation(
            technical_fit=0, difficulty=10, risk=10, clarity=0, reusability=0,
            estimated_hours_min=200, estimated_hours_max=300,
        ),
        scoring,
    )
    assert 0 <= schlechtest.overall_score <= 100
