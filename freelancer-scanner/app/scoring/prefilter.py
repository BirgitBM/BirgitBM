"""Vorfilter -- laeuft VOR dem LLM-Aufruf und spart damit Kosten.

Alles, was sich ohne KI entscheiden laesst, wird hier entschieden:
ausgeschlossene Technologien, zu kleines Budget, unbrauchbare
Beschreibungen, aussichtslose Gebotslage.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.config import ExcludeConfig, ScoringConfig, get_exclude_config, get_scoring_config
from app.models.project import Project
from app.scoring.engine import budget_mid_usd


@dataclass(frozen=True)
class PrefilterResult:
    passed: bool
    reason: str | None = None

    @property
    def short_reason(self) -> str:
        return self.reason or ""


def _contains_term(haystack: str, term: str) -> bool:
    """Wortgrenzen-Treffer, damit 'SAP' nicht in 'SAP-freies Sapphire' anschlaegt."""
    pattern = r"(?<![A-Za-z0-9])" + re.escape(term.lower()) + r"(?![A-Za-z0-9])"
    return re.search(pattern, haystack) is not None


def check(
    project: Project,
    scoring: ScoringConfig | None = None,
    excludes: ExcludeConfig | None = None,
) -> PrefilterResult:
    scoring = scoring or get_scoring_config()
    excludes = excludes or get_exclude_config()
    rules = scoring.prefilter

    haystack = " ".join(
        [project.title or "", project.description or "", " ".join(project.skills or [])]
    ).lower()

    for technology in excludes.exclude_technologies:
        if _contains_term(haystack, technology):
            return PrefilterResult(False, f"Ausgeschlossene Technologie: {technology}")

    for phrase in excludes.exclude_phrases:
        if phrase.lower() in haystack:
            return PrefilterResult(False, f"Warnsignal im Text: '{phrase}'")

    description = (project.description or "").strip()
    if len(description) < rules.min_description_chars:
        return PrefilterResult(
            False,
            f"Beschreibung zu kurz ({len(description)} Zeichen, "
            f"mindestens {rules.min_description_chars})",
        )

    budget = budget_mid_usd(project, scoring)
    if budget is None:
        if rules.skip_if_no_budget:
            return PrefilterResult(False, "Kein Budget angegeben")
    elif project.project_type != "hourly" and budget < rules.min_budget_usd:
        return PrefilterResult(
            False,
            f"Budget zu niedrig (~{budget:.0f} USD, mindestens {rules.min_budget_usd:.0f} USD)",
        )

    if project.bid_count is not None and project.bid_count > rules.max_existing_bids:
        return PrefilterResult(
            False,
            f"Bereits {project.bid_count} Gebote (Grenze: {rules.max_existing_bids})",
        )

    return PrefilterResult(True)
