"""Demo-Provider: liefert Antworten ohne API-Schluessel und ohne Kosten.

Fuer die fuenf Beispielprojekte sind Einschaetzungen fest hinterlegt.
Fuer alles andere greift eine einfache, schluesselwortbasierte Heuristik,
damit der Demo-Modus auch mit eigenen Testdaten nicht abbricht.

Wichtig: der Demo-Provider berechnet KEINEN Score. Er liefert nur die
Einschaetzungen -- gerechnet wird in der echten Scoring-Engine.
"""

from __future__ import annotations

import json

from app.freelancer.demo_data import demo_evaluation_for, demo_proposal_for
from app.llm.provider import LLMProvider, LLMRequest, LLMResponse
from app.logging_setup import get_logger

logger = get_logger(__name__)

# Signalwoerter fuer die Heuristik, wenn kein hinterlegtes Beispiel passt.
GOOD_SIGNALS = [
    "n8n", "make.com", "zapier", "google sheets", "gmail", "airtable",
    "webhook", "slack", "shopify", "wordpress", "calendly", "crm",
    "spreadsheet", "email automation", "gohighlevel", "openai", "chatgpt",
]
BAD_SIGNALS = [
    "saas platform", "microservices", "kafka", "multi-tenant", "pci",
    "on-call", "devops", "infrastructure", "mobile app", "react native",
    "machine learning model", "from scratch", "distributed", "compliance",
]


def _heuristic_evaluation(title: str, description: str) -> dict:
    text = f"{title} {description}".lower()
    good = sum(1 for token in GOOD_SIGNALS if token in text)
    bad = sum(1 for token in BAD_SIGNALS if token in text)

    fit = max(0, min(10, 4 + good - 2 * bad))
    difficulty = max(0, min(10, 3 + 2 * bad))
    risk = max(0, min(10, 3 + 2 * bad))
    clarity = 7 if len(description) > 400 else 5
    reusability = max(0, min(10, 3 + good))
    hours_min = 4 + 6 * bad
    hours_max = hours_min * 2

    return {
        "technical_fit": fit,
        "difficulty": difficulty,
        "risk": risk,
        "clarity": clarity,
        "reusability": reusability,
        "estimated_hours_min": hours_min,
        "estimated_hours_max": hours_max,
        "estimated_tool_cost_usd": 0,
        "required_tools": [token for token in GOOD_SIGNALS if token in text][:5] or ["n8n"],
        "required_apis": [],
        "red_flags": [token for token in BAD_SIGNALS if token in text][:5],
        "short_summary": "Demo-Einschaetzung ohne echten KI-Aufruf (DEMO_MODE aktiv).",
        "implementation_idea": (
            "Im DEMO_MODE wird kein LLM aufgerufen. Diese Einschaetzung stammt aus einer "
            "einfachen Schluesselwort-Heuristik und dient nur dazu, den Ablauf zu testen."
        ),
        "reason_for_score": (
            f"Heuristik: {good} passende und {bad} kritische Signalwoerter im Text gefunden."
        ),
    }


def _heuristic_proposal(title: str) -> dict:
    return {
        "opening": (
            "DEMO_MODE: this is a placeholder draft. Connect an LLM provider to "
            "generate a real, project-specific proposal."
        ),
        "understanding": f"Placeholder draft for: {title}",
        "solution_steps": [
            "Set LLM_PROVIDER to anthropic or openai in your .env file",
            "Add the matching API key",
            "Set DEMO_MODE=false and restart the application",
        ],
        "deliverables": ["A real proposal draft generated from the project description"],
        "timeline": "",
        "questions": [],
        "closing": "",
    }


class DemoProvider(LLMProvider):
    name = "demo"

    @property
    def model(self) -> str:
        return "demo-stub"

    def complete(self, request: LLMRequest) -> LLMResponse:
        context = request.context or {}
        freelancer_id = str(context.get("freelancer_id", ""))
        task = context.get("task", "evaluate")
        title = context.get("title", "")
        description = context.get("description", "")

        if task == "proposal":
            payload = demo_proposal_for(freelancer_id) or _heuristic_proposal(title)
        else:
            payload = demo_evaluation_for(freelancer_id) or _heuristic_evaluation(
                title, description
            )
            if demo_evaluation_for(freelancer_id) is None:
                logger.info(
                    "Kein hinterlegtes Demo-Beispiel fuer '%s' -- Heuristik verwendet.",
                    freelancer_id,
                )

        # Die hinterlegten Zusatzfelder gehoeren nicht in die LLM-Antwort.
        clean = {key: value for key, value in payload.items() if not key.startswith("demo_")}
        return LLMResponse(text=json.dumps(clean, ensure_ascii=False), model=self.model)
