"""Zentraler LLM-Client.

Hier passiert alles, was fuer jeden Anbieter gleich gelten muss:
Prompt bauen, Antwort einlesen, gegen das Schema validieren und bei
ungueltiger Antwort einen Retry mit konkretem Fehlerhinweis ausloesen.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, ValidationError

from app.config import BASE_DIR, Settings, get_settings
from app.llm.factory import build_provider
from app.llm.json_utils import JSONExtractionError, extract_json_object
from app.llm.provider import LLMError, LLMProvider, LLMRequest
from app.logging_setup import get_logger
from app.models.evaluation import LLMEvaluation, Proposal
from app.models.project import Project

logger = get_logger(__name__)

PROMPT_DIR = BASE_DIR / "app" / "llm" / "prompts"


def _load_prompt(filename: str) -> str:
    path: Path = PROMPT_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt-Datei fehlt: {path}")
    return path.read_text(encoding="utf-8")


def _project_block(project: Project) -> str:
    """Die Projektdaten in einer fuer das Modell gut lesbaren Form."""
    budget = project.budget_display
    skills = ", ".join(project.skills or []) or "none listed"
    bids = project.bid_count if project.bid_count is not None else "unknown"
    return (
        f"TITLE:\n{project.title}\n\n"
        f"DESCRIPTION:\n{project.description}\n\n"
        f"SKILLS TAGGED BY CLIENT: {skills}\n"
        f"CLIENT BUDGET: {budget}\n"
        f"PROJECT TYPE: {project.project_type}\n"
        f"EXISTING BIDS: {bids}\n"
    )


class LLMClient:
    def __init__(
        self,
        provider: LLMProvider | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.provider = provider or build_provider(self.settings)

    @property
    def model(self) -> str:
        return self.provider.model

    @property
    def provider_name(self) -> str:
        return self.provider.name

    # ------------------------------------------------------------------
    def _complete_validated(
        self,
        *,
        schema: type[BaseModel],
        system_prompt: str,
        user_prompt: str,
        context: dict,
        max_tokens: int,
    ) -> BaseModel:
        """Ruft das Modell auf und validiert die Antwort. Mit Retry.

        Beim zweiten Versuch bekommt das Modell den konkreten Validierungs-
        fehler mitgeteilt -- das korrigiert die meisten Ausreisser.
        """
        attempts = max(1, self.settings.llm_max_retries + 1)
        current_prompt = user_prompt
        last_error: Exception | None = None

        for attempt in range(1, attempts + 1):
            try:
                response = self.provider.complete(
                    LLMRequest(
                        system_prompt=system_prompt,
                        user_prompt=current_prompt,
                        max_tokens=max_tokens,
                        context=context,
                    )
                )
                payload = extract_json_object(response.text)
                return schema.model_validate(payload)

            except (JSONExtractionError, ValidationError) as exc:
                last_error = exc
                logger.warning(
                    "Ungueltige Modellantwort (Versuch %s/%s): %s",
                    attempt,
                    attempts,
                    str(exc)[:300],
                )
                if attempt < attempts:
                    current_prompt = (
                        f"{user_prompt}\n\n"
                        "--- CORRECTION REQUIRED ---\n"
                        "Your previous answer could not be processed. The error was:\n"
                        f"{str(exc)[:800]}\n\n"
                        "Respond again with ONE valid JSON object matching the schema "
                        "exactly. All numeric ratings must be numbers between 0 and 10. "
                        "No markdown fences, no text before or after the JSON."
                    )

            except LLMError as exc:
                # Anbieterfehler (Timeout, Auth, Rate-Limit) -- kein Retry,
                # das SDK hat bereits selbst wiederholt.
                logger.error("LLM-Anbieterfehler: %s", exc)
                raise

        raise LLMError(
            f"Das Modell lieferte nach {attempts} Versuchen keine gueltige Antwort. "
            f"Letzter Fehler: {last_error}"
        )

    # ------------------------------------------------------------------
    def evaluate_project(self, project: Project) -> LLMEvaluation:
        """Bewertet ein Projekt. Gibt nur Einschaetzungen zurueck, keinen Score."""
        result = self._complete_validated(
            schema=LLMEvaluation,
            system_prompt=_load_prompt("evaluate.md"),
            user_prompt=(
                "Evaluate the following freelance project.\n\n" + _project_block(project)
            ),
            context={
                "task": "evaluate",
                "freelancer_id": project.freelancer_id,
                "title": project.title,
                "description": project.description,
            },
            max_tokens=16000,
        )
        assert isinstance(result, LLMEvaluation)
        return result

    def draft_proposal(self, project: Project, evaluation: LLMEvaluation) -> Proposal:
        """Erstellt einen Bewerbungsentwurf. Wird nie automatisch versendet."""
        plan = (
            "TECHNICAL PLAN (from the evaluation, use it):\n"
            f"{evaluation.implementation_idea}\n\n"
            f"TOOLS: {', '.join(evaluation.required_tools) or 'not specified'}\n"
            f"APIS: {', '.join(evaluation.required_apis) or 'not specified'}\n"
            f"ESTIMATED EFFORT: {evaluation.estimated_hours_min:.0f}-"
            f"{evaluation.estimated_hours_max:.0f} hours\n"
        )
        result = self._complete_validated(
            schema=Proposal,
            system_prompt=_load_prompt("proposal.md"),
            user_prompt=(
                "Write a bid proposal for the following project.\n\n"
                + _project_block(project)
                + "\n"
                + plan
            ),
            context={
                "task": "proposal",
                "freelancer_id": project.freelancer_id,
                "title": project.title,
                "description": project.description,
            },
            max_tokens=8000,
        )
        assert isinstance(result, Proposal)
        return result
