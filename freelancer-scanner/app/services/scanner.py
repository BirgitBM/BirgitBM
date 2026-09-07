"""Der Scan-Durchlauf: holen -> entdoppeln -> vorfiltern -> bewerten -> melden.

Wichtig: Es findet KEINE automatische Bewerbung statt. Der Bewerbungs-
entwurf wird lediglich erzeugt und gespeichert. Versendet wird nichts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from app.config import ScoringConfig, Settings, get_keywords, get_scoring_config, get_settings
from app.database.repository import ProjectRepository
from app.database.session import session_scope
from app.freelancer.client import FreelancerAPIError, FreelancerClient
from app.freelancer.demo_client import build_client
from app.freelancer.mapper import to_project
from app.llm.client import LLMClient
from app.llm.provider import LLMError
from app.logging_setup import get_logger
from app.models.project import Project, ProjectStatus
from app.notifications.console import build_notifier
from app.notifications.notifier import Notifier
from app.scoring import prefilter
from app.scoring.engine import score_project

logger = get_logger(__name__)


@dataclass
class ScanReport:
    """Ergebnis eines Durchlaufs -- fuer Log und Dashboard."""

    fetched: int = 0
    duplicates: int = 0
    prefiltered: int = 0
    evaluated: int = 0
    above_threshold: int = 0
    arbitrage: int = 0
    drafted: int = 0
    notified: int = 0
    errors: list[str] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def summary(self) -> str:
        return (
            f"{self.fetched} gefunden, {self.duplicates} bereits bekannt, "
            f"{self.prefiltered} vorgefiltert, {self.evaluated} bewertet, "
            f"{self.above_threshold} ueber Mindestscore, {self.arbitrage} ARBITRAGE, "
            f"{self.drafted} Entwuerfe, {self.notified} gemeldet"
        )


class Scanner:
    def __init__(
        self,
        client: FreelancerClient | None = None,
        llm: LLMClient | None = None,
        notifier: Notifier | None = None,
        settings: Settings | None = None,
        scoring: ScoringConfig | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.scoring = scoring or get_scoring_config()
        self.client = client or build_client(self.settings)
        self.llm = llm or LLMClient(settings=self.settings)
        self.notifier = notifier or build_notifier(self.settings)

    # ------------------------------------------------------------------
    def _fetch_candidates(self, report: ScanReport) -> dict[str, Project]:
        """Holt Projekte zu allen Suchbegriffen und entfernt Dubletten.

        Die Entdopplung passiert zweistufig: innerhalb des Durchlaufs
        ueber ein Dictionary, gegen die Datenbank ueber existing_ids().
        """
        candidates: dict[str, Project] = {}
        max_age = timedelta(hours=self.settings.freelancer_max_age_hours)
        now = datetime.now(timezone.utc)

        for keyword in get_keywords():
            try:
                raw_projects = self.client.search(keyword)
            except FreelancerAPIError as exc:
                message = f"Suche '{keyword}' fehlgeschlagen: {exc}"
                logger.error(message)
                report.errors.append(message)
                continue

            for raw in raw_projects:
                users = raw.pop("_users", None)
                project = to_project(raw, matched_keyword=keyword, users=users)
                if project is None:
                    continue

                report.fetched += 1

                if project.posted_at and now - project.posted_at > max_age:
                    continue
                # Innerhalb eines Durchlaufs kann dasselbe Projekt bei
                # mehreren Suchbegriffen auftauchen.
                candidates.setdefault(project.freelancer_id, project)

        return candidates

    # ------------------------------------------------------------------
    def _evaluate_and_store(self, project: Project, report: ScanReport) -> None:
        """Bewertet ein einzelnes Projekt und speichert das Ergebnis."""
        check = prefilter.check(project, self.scoring)
        if not check.passed:
            project.status = ProjectStatus.REJECTED
            project.rejected_reason = check.reason
            logger.info("Vorgefiltert: %s -- %s", project.title[:60], check.reason)
            report.prefiltered += 1
            with session_scope() as session:
                ProjectRepository(session).add(project)
            return

        try:
            evaluation = self.llm.evaluate_project(project)
        except (LLMError, Exception) as exc:  # noqa: BLE001 - bewusst breit
            # Ein einzelnes fehlgeschlagenes Projekt darf den Durchlauf
            # nicht abbrechen. Es wird gespeichert und ist im Dashboard
            # als fehlerhaft erkennbar.
            message = f"Bewertung fehlgeschlagen fuer '{project.title[:50]}': {exc}"
            logger.error(message)
            report.errors.append(message)
            project.evaluation_error = str(exc)[:1000]
            with session_scope() as session:
                ProjectRepository(session).add(project)
            return

        score = score_project(project, evaluation, self.scoring)

        project.overall_score = score.overall_score
        project.opportunity_score = score.opportunity_score
        project.category = score.category
        project.risk_level = score.risk_level.value
        project.recommended_bid_usd = score.recommended_bid_usd
        project.effective_hourly_rate_usd = score.effective_hourly_rate_usd
        project.budget_hourly_rate_usd = score.budget_hourly_rate_usd
        project.automation_leverage = evaluation.automation_leverage
        project.freshness_bonus = score.freshness_bonus
        project.age_minutes = score.age_minutes
        project.is_arbitrage = score.is_arbitrage
        project.estimated_hours_min = evaluation.estimated_hours_min
        project.estimated_hours_max = evaluation.estimated_hours_max
        project.evaluation = evaluation.model_dump()
        project.score_breakdown = score.model_dump(mode="json")
        project.llm_provider = self.llm.provider_name
        project.llm_model = self.llm.model
        report.evaluated += 1

        logger.info(
            "Bewertet: %-52s Score %5.1f  Chance %5.1f (%s)%s",
            project.title[:52],
            score.overall_score,
            score.opportunity_score,
            score.category,
            "  [ARBITRAGE]" if score.is_arbitrage else "",
        )

        # Zwei getrennte Schwellen:
        #   melden  -> opportunity_score (zeitkritisch, kostet nichts)
        #   Entwurf -> overall_score (Qualitaet, kostet einen LLM-Aufruf)
        should_notify = score.opportunity_score >= self.scoring.min_score
        should_draft = (
            score.overall_score >= self.scoring.apply_score or score.is_arbitrage
        )

        proposal_excerpt: str | None = None
        if should_notify:
            report.above_threshold += 1
            project.status = ProjectStatus.INTERESTING
        if score.is_arbitrage:
            report.arbitrage += 1

        if should_draft:
            try:
                proposal = self.llm.draft_proposal(project, evaluation)
                project.proposal_draft = proposal.as_text()
                proposal_excerpt = proposal.opening
                report.drafted += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Bewerbungsentwurf fehlgeschlagen: %s", exc)

        with session_scope() as session:
            stored = ProjectRepository(session).add(project)
            stored_id = stored.id

        if should_notify:
            if self.notifier.send_project(project, score, proposal_excerpt):
                report.notified += 1
                with session_scope() as session:
                    ProjectRepository(session).mark_notified(stored_id)

    # ------------------------------------------------------------------
    def run(self) -> ScanReport:
        report = ScanReport()
        logger.info(
            "Scan gestartet (Quelle: %s, LLM: %s/%s, melden ab %s, Entwurf ab %s)",
            self.client.name,
            self.llm.provider_name,
            self.llm.model,
            self.scoring.min_score,
            self.scoring.apply_score,
        )

        candidates = self._fetch_candidates(report)

        with session_scope() as session:
            known = ProjectRepository(session).existing_ids(list(candidates))
        report.duplicates = len(known)

        new_projects = [
            project
            for freelancer_id, project in candidates.items()
            if freelancer_id not in known
        ]

        for project in new_projects:
            try:
                self._evaluate_and_store(project, report)
            except Exception as exc:  # noqa: BLE001 - letzte Absicherung
                message = f"Unerwarteter Fehler bei '{project.freelancer_id}': {exc}"
                logger.exception(message)
                report.errors.append(message)

        logger.info("Scan beendet: %s", report.summary())
        return report


def run_scan() -> ScanReport:
    """Einstiegspunkt fuer Scheduler, CLI und Dashboard-Button."""
    scanner = Scanner()
    try:
        return scanner.run()
    finally:
        scanner.client.close()
