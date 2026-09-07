"""Der komplette Ablauf im DEMO_MODE -- ohne API, ohne LLM, ohne Telegram.

Das ist der wichtigste Test: er prueft, dass die fuenf Beispielprojekte
den Weg holen -> filtern -> bewerten -> speichern -> melden durchlaufen
und dabei die erwartete Einordnung bekommen.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import get_scoring_config
from app.database.repository import ProjectRepository
from app.database.session import session_scope
from app.freelancer.demo_data import DEMO_PROJECTS
from app.freelancer.mapper import to_project
from app.models.project import ProjectStatus
from app.notifications.formatter import format_project_message
from app.notifications.notifier import Notifier
from app.services.scanner import Scanner

GUTE_PROJEKTE = {"demo-1001", "demo-1002", "demo-1003"}
SCHLECHTE_PROJEKTE = {"demo-2001", "demo-2002"}


class RecordingNotifier(Notifier):
    """Merkt sich die Meldungen, statt sie zu versenden."""

    name = "recording"

    def __init__(self) -> None:
        self.sent: list[tuple[str, float, str | None]] = []

    def send_project(self, project, score, proposal_excerpt=None) -> bool:
        # Der Nachrichtentext muss sich auch wirklich bauen lassen.
        format_project_message(project, score, proposal_excerpt)
        self.sent.append((project.freelancer_id, score.overall_score, proposal_excerpt))
        return True


@pytest.fixture
def demo_run():
    notifier = RecordingNotifier()
    scanner = Scanner(notifier=notifier)
    report = scanner.run()
    with session_scope() as session:
        projects = {
            project.freelancer_id: project
            for project in ProjectRepository(session).list_projects(
                include_rejected=True, limit=100
            )
        }
    return report, projects, notifier


# --- Ablauf -----------------------------------------------------------------
def test_alle_fuenf_beispiele_werden_verarbeitet(demo_run):
    report, projects, _ = demo_run
    assert report.fetched == len(DEMO_PROJECTS)
    assert len(projects) == 5
    assert report.evaluated == 5
    assert report.errors == []


def test_kein_projekt_wird_vorgefiltert(demo_run):
    """Die Beispiele sind so gewaehlt, dass alle bis zur Bewertung kommen."""
    report, _, _ = demo_run
    assert report.prefiltered == 0


# --- Erwartete Einordnung ---------------------------------------------------
def test_die_ersten_drei_bekommen_gute_scores(demo_run):
    _, projects, _ = demo_run
    scoring = get_scoring_config()
    for freelancer_id in sorted(GUTE_PROJEKTE):
        project = projects[freelancer_id]
        assert project.overall_score >= scoring.min_score, (
            f"{freelancer_id} kam nur auf {project.overall_score}"
        )
        assert project.category == "A"
        assert project.status is ProjectStatus.INTERESTING


def test_die_letzten_zwei_bekommen_schlechte_scores(demo_run):
    _, projects, _ = demo_run
    scoring = get_scoring_config()
    for freelancer_id in sorted(SCHLECHTE_PROJEKTE):
        project = projects[freelancer_id]
        assert project.overall_score < scoring.min_score
        assert project.category == "C"
        assert project.status is ProjectStatus.NEW


def test_zwischen_gut_und_schlecht_liegt_ein_klarer_abstand(demo_run):
    _, projects, _ = demo_run
    schlechtester_guter = min(projects[i].overall_score for i in GUTE_PROJEKTE)
    bester_schlechter = max(projects[i].overall_score for i in SCHLECHTE_PROJEKTE)
    assert schlechtester_guter - bester_schlechter > 40


def test_die_schlechten_sind_als_hochriskant_erkannt(demo_run):
    """Die beiden schlechten Projekte liegen ohnehin so tief, dass die
    Deckel nicht mehr greifen muessen -- geprueft wird deshalb, dass die
    Risikoerkennung selbst angeschlagen hat."""
    _, projects, _ = demo_run
    for freelancer_id in SCHLECHTE_PROJEKTE:
        project = projects[freelancer_id]
        assert project.risk_level == "hoch"
        assert project.evaluation["red_flags"], "Warnsignale fehlen"
        assert project.score_breakdown["raw_score"] < 40


def test_budget_kann_ein_schlechtes_projekt_nicht_retten(demo_run):
    """Kernanforderung, an echten Demo-Daten geprueft.

    Das SaaS-Projekt bekommt das Zehn- und das Hundertfache seines Budgets.
    Weil die Budget-Komponente nur 20 Prozent wiegt und bei 100 Prozent
    gedeckelt ist, kann der Score um hoechstens 20 Punkte steigen -- und
    bleibt damit weit unter dem Mindestscore.
    """
    from app.config import get_scoring_config
    from app.models.evaluation import LLMEvaluation
    from app.models.project import Project
    from app.scoring.engine import score_project

    _, projects, _ = demo_run
    scoring = get_scoring_config()
    original = projects["demo-2001"]
    evaluation = LLMEvaluation.model_validate(original.evaluation)

    def score_mit_budget(low: float, high: float) -> float:
        kopie = Project(
            freelancer_id="was-waere-wenn",
            title=original.title,
            description=original.description,
            currency="USD",
            project_type="fixed",
            skills=list(original.skills or []),
            employer_verified=True,
            budget_min=low,
            budget_max=high,
        )
        return score_project(kopie, evaluation, scoring).overall_score

    normal = score_mit_budget(3000, 5000)
    zehnfach = score_mit_budget(30000, 50000)
    hundertfach = score_mit_budget(300000, 500000)

    assert normal < scoring.min_score
    assert zehnfach < scoring.min_score
    assert hundertfach < scoring.min_score
    # Mehr als die Budget-Gewichtung darf es niemals bewegen.
    assert hundertfach - normal <= 100 * scoring.weights.budget_ratio + 0.1
    # Und ab einem gewissen Punkt bringt mehr Geld gar nichts mehr.
    assert hundertfach == zehnfach


# --- Folgeschritte ----------------------------------------------------------
def test_nur_gute_projekte_werden_gemeldet(demo_run):
    _, _, notifier = demo_run
    gemeldet = {freelancer_id for freelancer_id, _, _ in notifier.sent}
    assert gemeldet == GUTE_PROJEKTE


def test_nur_gute_projekte_bekommen_einen_bewerbungsentwurf(demo_run):
    _, projects, _ = demo_run
    for freelancer_id in GUTE_PROJEKTE:
        entwurf = projects[freelancer_id].proposal_draft
        assert entwurf and len(entwurf) > 200
    for freelancer_id in SCHLECHTE_PROJEKTE:
        assert projects[freelancer_id].proposal_draft is None


def test_bewerbungsentwuerfe_enthalten_keine_floskeln(demo_run):
    """Genau das, was der Prompt verbietet -- hier wird es geprueft."""
    _, projects, _ = demo_run
    floskeln = [
        "i am an experienced developer",
        "years of experience",
        "dear sir",
        "i hope you are well",
        "best fit for this job",
    ]
    for freelancer_id in GUTE_PROJEKTE:
        entwurf = projects[freelancer_id].proposal_draft.lower()
        for floskel in floskeln:
            assert floskel not in entwurf, f"{freelancer_id} enthaelt '{floskel}'"


def test_gebotsempfehlung_und_aufwand_sind_gesetzt(demo_run):
    _, projects, _ = demo_run
    for freelancer_id in GUTE_PROJEKTE:
        project = projects[freelancer_id]
        assert project.recommended_bid_usd > 0
        assert project.estimated_hours_min > 0
        assert project.risk_level == "niedrig"


def test_alle_geforderten_felder_sind_gespeichert(demo_run):
    _, projects, _ = demo_run
    project = projects["demo-1001"]
    assert project.freelancer_id and project.title and project.description
    assert project.url and project.posted_at and project.currency
    assert project.budget_min and project.budget_max
    assert project.skills and project.bid_count is not None
    assert project.fetched_at and project.evaluation and project.status

    for feld in ("technical_fit", "risk", "clarity", "reusability", "difficulty",
                 "estimated_hours_min", "estimated_hours_max", "required_tools",
                 "required_apis", "red_flags", "short_summary",
                 "implementation_idea", "reason_for_score"):
        assert feld in project.evaluation, f"Feld fehlt: {feld}"


# --- Mapper mit echtem API-Format -------------------------------------------
def test_mapper_versteht_das_verschachtelte_api_format():
    """Gegenprobe: die Struktur, die die echte Freelancer-API liefert."""
    raw = {
        "id": 12345,
        "title": "Zapier automation",
        "description": "text",
        "seo_url": "automation/zapier-job",
        "time_submitted": 1757000000,
        "budget": {"minimum": 250, "maximum": 750},
        "currency": {"code": "eur"},
        "type": "hourly",
        "jobs": [{"name": "Zapier"}, {"name": "API"}],
        "bid_stats": {"bid_count": 9, "bid_avg": 480.0},
        "owner_id": 77,
    }
    users = {"77": {"status": {"payment_verified": True},
                    "location": {"country": {"name": "Spain"}}}}

    project = to_project(raw, matched_keyword="Zapier", users=users)

    assert project.freelancer_id == "12345"
    assert project.currency == "EUR"
    assert project.project_type == "hourly"
    assert project.skills == ["Zapier", "API"]
    assert project.bid_count == 9
    assert project.employer_verified is True
    assert project.employer_country == "Spain"
    assert project.url.endswith("automation/zapier-job")
    assert project.posted_at is not None


def test_mapper_ueberspringt_datensaetze_ohne_id():
    assert to_project({"title": "kaputt"}) is None


# --- Dashboard --------------------------------------------------------------
def test_dashboard_und_detailseite_sind_erreichbar(demo_run):
    from app.main import app

    _, projects, _ = demo_run
    with TestClient(app) as client:
        antwort = client.get("/")
        assert antwort.status_code == 200
        assert "Freelancer Scanner" in antwort.text
        assert "DEMO-MODUS aktiv" in antwort.text

        project_id = projects["demo-1001"].id
        detail = client.get(f"/projects/{project_id}")
        assert detail.status_code == 200
        assert "Bewerbungsentwurf" in detail.text
        assert "Technischer Umsetzungsplan" in detail.text

        assert client.get("/projects/999999").status_code == 404
        assert client.get("/health").json()["demo_mode"] is True


def test_status_button_funktioniert(demo_run):
    from app.main import app

    _, projects, _ = demo_run
    project_id = projects["demo-1001"].id

    with TestClient(app) as client:
        antwort = client.post(
            f"/projects/{project_id}/status",
            data={"status": "APPLIED"},
            follow_redirects=False,
        )
        assert antwort.status_code == 303

    with session_scope() as session:
        assert ProjectRepository(session).get(project_id).status is ProjectStatus.APPLIED


def test_es_gibt_keinen_endpunkt_der_sich_bewirbt():
    """Sicherheitsnetz gegen versehentliche Automatik-Bewerbung."""
    from app.main import app

    pfade = {getattr(route, "path", "") for route in app.routes}
    verboten = {"/apply", "/bid", "/submit-bid", "/projects/{project_id}/apply"}
    assert not (pfade & verboten)

    quelle = (
        __import__("pathlib").Path("app").rglob("*.py")
    )
    for datei in quelle:
        text = datei.read_text(encoding="utf-8").lower()
        assert "place_bid" not in text
        assert "/bids/" not in text
