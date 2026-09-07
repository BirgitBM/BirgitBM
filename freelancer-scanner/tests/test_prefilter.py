"""Der Vorfilter muss greifen, bevor Kosten entstehen."""

from __future__ import annotations

from app.scoring import prefilter


def test_normales_projekt_passiert(make_project):
    assert prefilter.check(make_project()).passed


def test_ausgeschlossene_technologie_wird_aussortiert(make_project):
    result = prefilter.check(
        make_project(description="We need help with our Kubernetes cluster. " * 10)
    )
    assert not result.passed
    assert "Kubernetes" in result.reason


def test_ausschluss_greift_auch_in_den_skills(make_project):
    result = prefilter.check(make_project(skills=["Salesforce", "API"]))
    assert not result.passed
    assert "Salesforce" in result.reason


def test_ausschluss_beachtet_wortgrenzen(make_project):
    """'SAP' darf nicht in 'sapphire' oder 'SAAS' anschlagen."""
    result = prefilter.check(
        make_project(description="We build sapphire dashboards for our saas. " * 10)
    )
    assert result.passed


def test_zu_kurze_beschreibung_wird_aussortiert(make_project):
    result = prefilter.check(make_project(description="Need automation. Call me."))
    assert not result.passed
    assert "zu kurz" in result.reason.lower()


def test_zu_kleines_budget_wird_aussortiert(make_project):
    result = prefilter.check(make_project(budget_min=20, budget_max=40))
    assert not result.passed
    assert "Budget zu niedrig" in result.reason


def test_zu_viele_gebote_werden_aussortiert(make_project, scoring):
    result = prefilter.check(
        make_project(bid_count=scoring.prefilter.max_existing_bids + 1)
    )
    assert not result.passed
    assert "Gebote" in result.reason


def test_warnsignal_im_text_wird_aussortiert(make_project):
    result = prefilter.check(
        make_project(description="This is an unpaid test task to prove yourself. " * 10)
    )
    assert not result.passed


def test_stundenprojekt_wird_nicht_am_fixbudget_gemessen(make_project):
    """65 USD/h ist ein gutes Stundenprojekt, aber ein winziges Fixbudget."""
    result = prefilter.check(
        make_project(project_type="hourly", budget_min=55, budget_max=75)
    )
    assert result.passed
