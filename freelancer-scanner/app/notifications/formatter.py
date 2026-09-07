"""Baut den Nachrichtentext fuer ein interessantes Projekt."""

from __future__ import annotations

from app.models.evaluation import ScoreResult
from app.models.project import Project

RISK_EMOJI = {"niedrig": "🟢", "mittel": "🟡", "hoch": "🔴"}
MAX_PROPOSAL_EXCERPT = 400


def format_project_message(
    project: Project, score: ScoreResult, proposal_excerpt: str | None = None
) -> str:
    """Erzeugt die Telegram-Nachricht im HTML-Format."""

    def escape(value: str) -> str:
        return (
            str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        )

    evaluation = project.evaluation or {}
    tools = ", ".join(evaluation.get("required_tools") or []) or "–"
    summary = evaluation.get("reason_for_score") or evaluation.get("short_summary") or "–"
    risk_icon = RISK_EMOJI.get(score.risk_level.value, "⚪")

    bid = (
        f"{score.recommended_bid_usd:,.0f} USD"
        if score.recommended_bid_usd is not None
        else "–"
    )
    if project.project_type == "hourly" and score.recommended_bid_usd is not None:
        bid = f"{score.recommended_bid_usd:,.0f} USD/h"

    lines = [
        f"🔥 <b>Neuer Freelancer Job – {score.overall_score:.0f}/100</b>",
        "",
        "<b>Titel:</b>",
        escape(project.title),
        "",
        "<b>Budget:</b>",
        escape(project.budget_display),
        "",
        "<b>Geschätzter Aufwand:</b>",
        escape(project.hours_display),
        "",
        "<b>Empfohlenes Gebot:</b>",
        escape(bid),
        "",
        "<b>Technologie:</b>",
        escape(tools),
        "",
        "<b>Risiko:</b>",
        f"{risk_icon} {escape(score.risk_level.value.capitalize())}",
        "",
        "<b>Warum interessant:</b>",
        escape(summary),
    ]

    if score.applied_caps:
        lines += ["", "<b>Achtung:</b>", escape("; ".join(score.applied_caps))]

    if project.bid_count is not None:
        lines += ["", f"<i>Bereits {project.bid_count} Gebote</i>"]

    if project.url:
        lines += ["", f'<a href="{escape(project.url)}">Projekt auf Freelancer öffnen</a>']

    if proposal_excerpt:
        excerpt = proposal_excerpt.strip()
        if len(excerpt) > MAX_PROPOSAL_EXCERPT:
            excerpt = excerpt[:MAX_PROPOSAL_EXCERPT].rsplit(" ", 1)[0] + " …"
        lines += ["", "<b>Bewerbungsentwurf (Anfang):</b>", f"<i>{escape(excerpt)}</i>"]

    return "\n".join(lines)
