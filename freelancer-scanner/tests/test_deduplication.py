"""Kein Projekt darf zweimal in der Datenbank landen."""

from __future__ import annotations

from app.database.repository import ProjectRepository
from app.database.session import session_scope
from app.models.project import ProjectStatus
from app.services.scanner import Scanner


def test_repository_erkennt_bekannte_ids(make_project):
    with session_scope() as session:
        ProjectRepository(session).add(make_project(freelancer_id="abc"))

    with session_scope() as session:
        repository = ProjectRepository(session)
        assert repository.exists("abc")
        assert not repository.exists("xyz")
        assert repository.existing_ids(["abc", "xyz"]) == {"abc"}


def test_existing_ids_vertraegt_eine_leere_liste():
    with session_scope() as session:
        assert ProjectRepository(session).existing_ids([]) == set()


def test_zweiter_scan_legt_nichts_neu_an():
    """Der entscheidende Test: derselbe Durchlauf zweimal, Bestand unveraendert."""
    scanner = Scanner()
    scanner.run()

    with session_scope() as session:
        nach_erstem = len(ProjectRepository(session).list_projects(include_rejected=True))

    scanner.client.reset()  # Demo-Quelle liefert wieder dieselben Projekte
    zweiter = scanner.run()

    with session_scope() as session:
        nach_zweitem = len(ProjectRepository(session).list_projects(include_rejected=True))

    assert nach_erstem == 5
    assert nach_zweitem == 5
    assert zweiter.evaluated == 0
    assert zweiter.duplicates == 5


def test_dasselbe_projekt_bei_zwei_suchbegriffen_zaehlt_einmal(make_project):
    """Innerhalb eines Durchlaufs darf ein Treffer nicht doppelt verarbeitet werden."""
    from app.freelancer.client import FreelancerClient

    raw = {
        "id": 999,
        "title": "n8n and Zapier automation for our CRM",
        "description": "B" * 400,
        "seo_url": "x/y",
        "budget": {"minimum": 400, "maximum": 600},
        "currency": {"code": "USD"},
        "type": "fixed",
        "jobs": [{"name": "n8n"}],
        "bid_stats": {"bid_count": 3},
    }

    class AlwaysSameClient(FreelancerClient):
        name = "always-same"

        def search(self, keyword: str, limit: int = 30):
            return [dict(raw)]

    scanner = Scanner(client=AlwaysSameClient())
    report = scanner.run()

    # 22 Suchbegriffe liefern denselben Treffer -> genau eine Bewertung.
    assert report.fetched == 22
    assert report.evaluated + report.prefiltered == 1

    with session_scope() as session:
        assert len(ProjectRepository(session).list_projects(include_rejected=True)) == 1


def test_status_laesst_sich_aendern(make_project):
    with session_scope() as session:
        stored = ProjectRepository(session).add(make_project())
        project_id = stored.id

    with session_scope() as session:
        ProjectRepository(session).set_status(project_id, ProjectStatus.APPLIED)

    with session_scope() as session:
        assert ProjectRepository(session).get(project_id).status is ProjectStatus.APPLIED
